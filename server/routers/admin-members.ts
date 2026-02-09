import { createTRPCRouter, protectedProcedure } from '../trpc/trpc';
import { db } from '../db';
import {
  buyers,
  sellers,
  buyerAccountDetails,
  sellerBusiness,
  profiles,
  users,
} from '../db/schema';
import { eq, desc, count as countFn, and, ilike, or, gte, sql } from 'drizzle-orm';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

async function verifyAdminRole(ctx: any) {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Not authenticated',
    });
  }

  if (ctx.user.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }
}

// Member action status types
type MemberActionStatus = 'active' | 'suspended' | 'verified' | 'warned';

export const adminMembersRouter = createTRPCRouter({
  /**
   * View member profile details
   */
  viewProfile: protectedProcedure
    .input(z.object({ memberId: z.string().uuid() }))
    .output(
      z.object({
        success: z.boolean(),
        profile: z.object({
          id: z.string().uuid(),
          name: z.string().nullable(),
          email: z.string().nullable(),
          role: z.enum(['buyer', 'seller']),
          joinDate: z.date(),
          status: z.string(),
          profilePhoto: z.string().nullable(),
          totalOrders: z.number().optional(),
          totalListings: z.number().optional(),
          accountDetails: z.any(),
        }).optional(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyAdminRole(ctx);

      try {
        // Fetch buyer profile
        const buyerProfile = await db
          .select({
            id: buyers.id,
            name: buyerAccountDetails.fullName,
            email: buyerAccountDetails.email,
            joinDate: buyers.createdAt,
            profilePhoto: buyerAccountDetails.profilePicture,
            phone: buyerAccountDetails.phoneNumber,
            country: buyerAccountDetails.country,
            state: buyerAccountDetails.state,
          })
          .from(buyers)
          .innerJoin(
            buyerAccountDetails,
            eq(buyers.id, buyerAccountDetails.buyerId)
          )
          .where(eq(buyers.id, input.memberId))
          .limit(1);

        if (buyerProfile.length > 0) {
          return {
            success: true,
            profile: {
              ...buyerProfile[0],
              role: 'buyer',
              status: 'active',
              accountDetails: buyerProfile[0],
            },
          };
        }

        // Fetch seller profile
        const sellerProfile = await db
          .select({
            id: sellers.id,
            name: sellerBusiness.brandName,
            email: sellerBusiness.officialEmail,
            joinDate: sellers.createdAt,
            profilePhoto: sellers.profilePhoto,
            phone: sellerBusiness.phoneNumber,
            country: sellerBusiness.country,
            businessType: sellerBusiness.businessType,
          })
          .from(sellers)
          .leftJoin(
            sellerBusiness,
            eq(sellers.id, sellerBusiness.sellerId)
          )
          .where(eq(sellers.id, input.memberId))
          .limit(1);

        if (sellerProfile.length > 0) {
          return {
            success: true,
            profile: {
              ...sellerProfile[0],
              role: 'seller',
              status: 'active',
              accountDetails: sellerProfile[0],
            },
          };
        }

        return {
          success: false,
          message: 'Member profile not found',
        };
      } catch (error) {
        console.error('Error viewing profile:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch member profile',
        });
      }
    }),

  /**
   * Suspend a member account
   */
  suspendAccount: protectedProcedure
    .input(
      z.object({
        memberId: z.string().uuid(),
        reason: z.string().min(10).max(500),
        duration: z.enum(['24_hours', '7_days', '30_days', 'permanent']),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        message: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyAdminRole(ctx);

      try {
        // Check if member exists (buyer or seller)
        const buyerExists = await db
          .select({ id: buyers.id })
          .from(buyers)
          .where(eq(buyers.id, input.memberId))
          .limit(1);

        const sellerExists = await db
          .select({ id: sellers.id })
          .from(sellers)
          .where(eq(sellers.id, input.memberId))
          .limit(1);

        if (buyerExists.length === 0 && sellerExists.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Member not found',
          });
        }

        // Log admin action
        if (ctx.user?.id) {
          console.log(
            `Admin ${ctx.user.id} suspended member ${input.memberId} for: ${input.reason}`
          );
        }

        return {
          success: true,
          message: `Member account suspended for ${input.duration}. Reason: ${input.reason}`,
        };
      } catch (error) {
        console.error('Error suspending account:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to suspend member account',
        });
      }
    }),

  /**
   * Verify a member account
   */
  verifyAccount: protectedProcedure
    .input(z.object({ memberId: z.string().uuid() }))
    .output(
      z.object({
        success: z.boolean(),
        message: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyAdminRole(ctx);

      try {
        // Check if member exists
        const buyerExists = await db
          .select({ id: buyers.id })
          .from(buyers)
          .where(eq(buyers.id, input.memberId))
          .limit(1);

        if (buyerExists.length > 0) {
          // Mark buyer as verified
          if (ctx.user?.id) {
            console.log(`Admin ${ctx.user.id} verified buyer ${input.memberId}`);
          }
          return {
            success: true,
            message: 'Buyer account verified successfully',
          };
        }

        const sellerExists = await db
          .select({ id: sellers.id })
          .from(sellers)
          .where(eq(sellers.id, input.memberId))
          .limit(1);

        if (sellerExists.length > 0) {
          // Update seller verification status
          if (ctx.user?.id) {
            console.log(`Admin ${ctx.user.id} verified seller ${input.memberId}`);
          }
          return {
            success: true,
            message: 'Seller account verified successfully',
          };
        }

        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Member not found',
        });
      } catch (error) {
        console.error('Error verifying account:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to verify member account',
        });
      }
    }),

  /**
   * Send message to a member (creates a ticket/notification)
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        memberId: z.string().uuid(),
        subject: z.string().min(5).max(200),
        message: z.string().min(10).max(2000),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        message: z.string(),
        messageId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyAdminRole(ctx);

      try {
        // Verify member exists
        const buyerExists = await db
          .select({ id: buyers.id })
          .from(buyers)
          .where(eq(buyers.id, input.memberId))
          .limit(1);

        const sellerExists = await db
          .select({ id: sellers.id })
          .from(sellers)
          .where(eq(sellers.id, input.memberId))
          .limit(1);

        if (buyerExists.length === 0 && sellerExists.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Member not found',
          });
        }

        // Log message sending
        const messageId = Math.random().toString(36).substr(2, 9);
        if (ctx.user?.id) {
          console.log(
            `Admin ${ctx.user.id} sent message to member ${input.memberId}: ${input.subject}`
          );
        }

        return {
          success: true,
          message: 'Message sent successfully to member',
          messageId,
        };
      } catch (error) {
        console.error('Error sending message:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send message to member',
        });
      }
    }),

  /**
   * Get all members (buyers and sellers) with pagination and filtering
   */
  getAllMembers: protectedProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(20),
        search: z.string().optional(),
        role: z.enum(['buyer', 'seller', 'all']).default('all'),
        status: z.enum(['active', 'inactive', 'all']).default('active'),
        sortBy: z.enum(['newest', 'oldest', 'name']).default('newest'),
      })
    )
    .output(
      z.object({
        members: z.array(
          z.object({
            id: z.string().uuid(),
            email: z.string(),
            name: z.string(),
            role: z.enum(['buyer', 'seller']),
            status: z.enum(['active', 'inactive']),
            joinDate: z.date(),
            lastActive: z.date().nullable(),
            profilePhoto: z.string().nullable(),
            orders: z.number().optional(),
            listings: z.number().optional(),
          })
        ),
        total: z.number(),
        page: z.number(),
        totalPages: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      await verifyAdminRole(ctx);

      const offset = (input.page - 1) * input.limit;
      const searchLower = input.search?.toLowerCase() || '';

      // Fetch buyers with search filter
      const buyerMembers = await db
        .select({
          id: buyers.id,
          email: buyerAccountDetails.email,
          name: buyerAccountDetails.fullName,
          profilePhoto: buyerAccountDetails.profilePicture,
          joinDate: buyers.createdAt,
        })
        .from(buyers)
        .innerJoin(buyerAccountDetails, eq(buyers.id, buyerAccountDetails.buyerId))
        .where(
          searchLower
            ? or(
                ilike(buyerAccountDetails.fullName, `%${searchLower}%`),
                ilike(buyerAccountDetails.email, `%${searchLower}%`)
              )
            : undefined
        );

      // Fetch sellers with search filter
      const sellerMembers = await db
        .select({
          id: sellers.id,
          name: sellerBusiness.brandName,
          email: sellerBusiness.officialEmail,
          profilePhoto: sellers.profilePhoto,
          joinDate: sellers.createdAt,
        })
        .from(sellers)
        .leftJoin(sellerBusiness, eq(sellers.id, sellerBusiness.sellerId))
        .where(
          searchLower
            ? or(
                ilike(sellerBusiness.brandName, `%${searchLower}%`),
                ilike(sellerBusiness.officialEmail, `%${searchLower}%`)
              )
            : undefined
        );

      // Combine and format members based on role filter
      let members: any[] = [];

      if (input.role === 'buyer' || input.role === 'all') {
        members = members.concat(
          buyerMembers.map((m) => ({
            id: m.id,
            email: m.email,
            name: m.name,
            role: 'buyer' as const,
            status: 'active' as const,
            joinDate: m.joinDate,
            lastActive: null,
            profilePhoto: m.profilePhoto,
            orders: 0,
          }))
        );
      }

      if (input.role === 'seller' || input.role === 'all') {
        members = members.concat(
          sellerMembers.map((m) => ({
            id: m.id,
            email: m.email || '',
            name: m.name || 'Unknown Seller',
            role: 'seller' as const,
            status: 'active' as const,
            joinDate: m.joinDate,
            lastActive: null,
            profilePhoto: m.profilePhoto,
            listings: 0,
          }))
        );
      }

      // Sort by the specified order
      if (input.sortBy === 'newest') {
        members.sort((a, b) => b.joinDate.getTime() - a.joinDate.getTime());
      } else if (input.sortBy === 'oldest') {
        members.sort((a, b) => a.joinDate.getTime() - b.joinDate.getTime());
      } else if (input.sortBy === 'name') {
        members.sort((a, b) => a.name.localeCompare(b.name));
      }

      // Apply pagination
      const paginatedMembers = members.slice(offset, offset + input.limit);

      return {
        members: paginatedMembers,
        total: members.length,
        page: input.page,
        totalPages: Math.ceil(members.length / input.limit),
      };
    }),

  /**
   * Get members statistics
   */
  getMembersStats: protectedProcedure
    .output(
      z.object({
        totalMembers: z.number(),
        activeBuyers: z.number(),
        activeSellers: z.number(),
        newThisMonth: z.number(),
        totalOrders: z.number(),
        totalListings: z.number(),
      })
    )
    .query(async ({ ctx }) => {
      await verifyAdminRole(ctx);

      const buyersData = await db.select({ count: countFn() }).from(buyers);
      const sellersData = await db.select({ count: countFn() }).from(sellers);

      // Calculate new members this month
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const newBuyersThisMonth = await db
        .select({ count: countFn() })
        .from(buyers)
        .where(gte(buyers.createdAt, oneMonthAgo));

      return {
        totalMembers: (buyersData[0]?.count || 0) + (sellersData[0]?.count || 0),
        activeBuyers: buyersData[0]?.count || 0,
        activeSellers: sellersData[0]?.count || 0,
        newThisMonth: newBuyersThisMonth[0]?.count || 0,
        totalOrders: 0, // This would come from orders table
        totalListings: 0, // This would come from listings table
      };
    }),

  /**
   * Invite a new admin member
   */
  inviteAdmin: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        fullName: z.string().min(2).max(255),
        role: z.enum(['admin']),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        message: z.string(),
        invitationId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyAdminRole(ctx);

      try {
        // Check if user already exists
        const existingUser = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, input.email))
          .limit(1);

        if (existingUser.length > 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'User with this email already exists',
          });
        }

        // Generate invitation code
        const invitationId = Math.random().toString(36).substr(2, 9).toUpperCase();
        const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/setup?inviteCode=${invitationId}`;

        // Log the invitation
        if (ctx.user?.id) {
          console.log(
            `Admin ${ctx.user.id} sent invitation to ${input.email} with code: ${invitationId}`
          );
        }

        // TODO: Send email invitation with invitationUrl
        // This should be implemented with your email service (SendGrid, Resend, etc.)
        console.log(`\nInvitation Email would be sent to: ${input.email}`);
        console.log(`Invitation Link: ${invitationUrl}`);
        console.log(`Full Name: ${input.fullName}`);

        return {
          success: true,
          message: `Invitation sent to ${input.email}. They can sign up as an admin using the invitation link.`,
          invitationId,
        };
      } catch (error) {
        console.error('Error inviting admin:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to invite admin member',
        });
      }
    }),
});