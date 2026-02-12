import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { db } from '../db';
import { inventoryReservations, listings } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

export const inventoryRouter = createTRPCRouter({
  // Get current inventory for a listing
  getInventory: publicProcedure
    .input(z.object({ listingId: z.string() }))
    .query(async ({ ctx, input }) => {
      const inventory = await ctx.supabase
        .from('inventory')
        .select('*')
        .eq('listing_id', input.listingId)
        .single();

      if (inventory.error) {
        return {
          id: input.listingId,
          totalStock: 0,
          reserved: 0,
          available: 0,
        };
      }

      return {
        id: inventory.data.id,
        totalStock: inventory.data.total_stock,
        reserved: inventory.data.reserved,
        available: inventory.data.total_stock - inventory.data.reserved,
      };
    }),

  // Reserve inventory (called when item added to cart)
  reserveInventory: protectedProcedure
    .input(
      z.object({
        listingId: z.string(),
        quantity: z.number().min(1),
        cartItemId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get current inventory
      const { data: inventory, error: fetchError } = await ctx.supabase
        .from('inventory')
        .select('*')
        .eq('listing_id', input.listingId)
        .single();

      if (fetchError || !inventory) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Inventory not found for listing',
        });
      }

      const available = inventory.total_stock - inventory.reserved;

      if (input.quantity > available) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Only ${available} items available`,
        });
      }

      // Create reservation
      const { data: reservation, error: reserveError } = await ctx.supabase
        .from('inventory_reservations')
        .insert({
          listing_id: input.listingId,
          cart_item_id: input.cartItemId,
          quantity: input.quantity,
          status: 'reserved',
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (reserveError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to reserve inventory',
        });
      }

      // Update reserved count
      const { error: updateError } = await ctx.supabase
        .from('inventory')
        .update({ reserved: inventory.reserved + input.quantity })
        .eq('id', inventory.id);

      if (updateError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update inventory',
        });
      }

      return {
        success: true,
        reservationId: reservation.id,
      };
    }),

  // Release reserved inventory
  releaseInventory: protectedProcedure
    .input(
      z.object({
        reservationId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get reservation
      const { data: reservation, error: fetchError } = await ctx.supabase
        .from('inventory_reservations')
        .select('*')
        .eq('id', input.reservationId)
        .single();

      if (fetchError || !reservation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Reservation not found',
        });
      }

      // Get inventory
      const { data: inventory, error: invError } = await ctx.supabase
        .from('inventory')
        .select('*')
        .eq('listing_id', reservation.listing_id)
        .single();

      if (invError || !inventory) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Inventory not found',
        });
      }

      // Update reservation status
      const { error: updateResError } = await ctx.supabase
        .from('inventory_reservations')
        .update({ status: 'released' })
        .eq('id', input.reservationId);

      if (updateResError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to release reservation',
        });
      }

      // Update reserved count
      const { error: updateInvError } = await ctx.supabase
        .from('inventory')
        .update({ reserved: Math.max(0, inventory.reserved - reservation.quantity) })
        .eq('id', inventory.id);

      if (updateInvError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update inventory',
        });
      }

      return { success: true };
    }),

  // Get all inventory reservations
  getInventoryReservations: protectedProcedure
    .input(
      z.object({
        productId: z.string().optional(),
        reservationId: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      if (input?.reservationId) {
        const reservations = await db
          .select()
          .from(inventoryReservations)
          .where(eq(inventoryReservations.id, input.reservationId))
          .orderBy(desc(inventoryReservations.createdAt));
        return reservations;
      }

      const reservations = await db
        .select()
        .from(inventoryReservations)
        .orderBy(desc(inventoryReservations.createdAt));
      await reservations;
      return reservations;
    }),

  // Get reservations by order
  getReservationsByOrder: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      const reservations = await db
        .select()
        .from(inventoryReservations)
        .where(eq(inventoryReservations.orderId, input.orderId))
        .orderBy(desc(inventoryReservations.createdAt));

      return reservations;
    }),

  // Create reservation
  createReservation: protectedProcedure
    .input(
      z.object({
        inventoryId: z.string(),
        orderId: z.string(),
        quantity: z.number().int().positive(),
        expiresAt: z.date().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const reservation = await db
        .insert(inventoryReservations)
        .values({
          inventoryId: input.inventoryId,
          orderId: input.orderId,
          quantity: input.quantity,
          status: 'reserved',
          expiresAt: input.expiresAt,
          notes: input.notes,
        })
        .returning();

      return reservation[0];
    }),

  // Confirm reservation
  confirmReservation: protectedProcedure
    .input(
      z.object({
        reservationId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const reservation = await db
        .update(inventoryReservations)
        .set({
          status: 'confirmed',
          confirmedAt: new Date(),
        })
        .where(eq(inventoryReservations.id, input.reservationId))
        .returning();

      return reservation[0];
    }),

  // Release reservation
  releaseReservation: protectedProcedure
    .input(
      z.object({
        reservationId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const reservation = await db
        .update(inventoryReservations)
        .set({
          status: 'released',
          releasedAt: new Date(),
        })
        .where(eq(inventoryReservations.id, input.reservationId))
        .returning();

      return reservation[0];
    }),

  // Get available inventory
  getAvailableInventory: publicProcedure
    .input(z.object({ listingId: z.string() }))
    .query(async ({ input }) => {
      const listing = await db
        .select()
        .from(listings)
        .where(eq(listings.id, input.listingId));

      if (!listing.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Listing not found',
        });
      }

      // Note: inventoryReservations uses orderId, not listingId
      // This query fetches reservations but availability is based on listing quantity
      const reservations = await db
        .select()
        .from(inventoryReservations)
        .where(
          eq(inventoryReservations.status, 'reserved')
        );

      const totalReserved = reservations.reduce((acc: any, r: any) => acc + r.quantity, 0);
      const quantityAvailable = Math.max(0, (listing[0].quantityAvailable || 0) - totalReserved);

      return {
        listingId: input.listingId,
        quantityAvailable,
        quantityReserved: totalReserved,
      };
    }),
});