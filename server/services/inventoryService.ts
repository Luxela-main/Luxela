import { db } from '../db';
import { listings, inventoryReservations } from '../db/schema';
import { and, eq, lt } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { TRPCError } from '@trpc/server';

export async function reserveInventory(
  inventoryId: string,
  quantity: number,
  orderId: string,
  expiresAt: Date
): Promise<string> {
  const reservationId = uuidv4();

  return await db.transaction(async (tx: any) => {
    await tx.insert(inventoryReservations).values({
      id: reservationId,
      inventoryId,
      orderId,
      quantity,
      expiresAt,
      status: 'reserved',
    });

    return reservationId;
  });
}

export async function confirmReservation(
  reservationId: string
): Promise<void> {
  return await db.transaction(async (tx: any) => {
    const [reservation] = await tx
      .select()
      .from(inventoryReservations)
      .where(eq(inventoryReservations.id, reservationId));

    if (!reservation) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Reservation not found',
      });
    }

    await tx
      .update(inventoryReservations)
      .set({
        status: 'confirmed',
        confirmedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(inventoryReservations.id, reservationId));
  });
}

export async function releaseReservation(reservationId: string): Promise<void> {
  await db
    .delete(inventoryReservations)
    .where(eq(inventoryReservations.id, reservationId));
}

export async function cleanupExpiredReservations(): Promise<number> {
  const now = new Date();
  const expired = await db
    .select()
    .from(inventoryReservations)
    .where(lt(inventoryReservations.expiresAt, now));

  const count = expired.length;

  if (count > 0) {
    await db
      .delete(inventoryReservations)
      .where(lt(inventoryReservations.expiresAt, now));
  }

  return count;
}

export async function getReservation(reservationId: string) {
  const [reservation] = await db
    .select()
    .from(inventoryReservations)
    .where(eq(inventoryReservations.id, reservationId));

  return reservation;
}
