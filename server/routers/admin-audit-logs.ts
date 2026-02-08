import { createTRPCRouter, protectedProcedure } from '../trpc/trpc';
import { db } from '../db';
import { listingActivityLog, users, listings } from '../db/schema';
import { eq, desc, and, gte, lt, count, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { sql } from 'drizzle-orm';

async function verifyAdminRole(ctx: any) {
  if (ctx.user?.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }
}

function getDateRange(days: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return { start, end };
}

export const adminAuditLogsRouter = createTRPCRouter({
  /**
   * Get audit logs for admin actions
   */
  getLogs: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().positive().max(100).default(50),
        offset: z.number().int().nonnegative().default(0),
        days: z.number().int().positive().default(30),
        actionType: z.string().optional(),
        performedByRole: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .output(
      z.object({
        logs: z.array(
          z.object({
            id: z.string().uuid(),
            listingId: z.string().uuid().nullable(),
            action: z.string(),
            actionType: z.string(),
            performedBy: z.string().uuid().nullable(),
            performedByRole: z.string().nullable(),
            performedByName: z.string().optional(),
            details: z.any().nullable(),
            oldValue: z.string().nullable(),
            newValue: z.string().nullable(),
            createdAt: z.date(),
          })
        ),
        total: z.number(),
        hasMore: z.boolean(),
      })
    )
    .query(async ({ ctx, input }) => {
      await verifyAdminRole(ctx);

      const { start, end } = getDateRange(input.days);

      // Build where conditions
      const whereConditions: any[] = [
        gte(listingActivityLog.createdAt, start),
        lt(listingActivityLog.createdAt, end),
      ];

      if (input.actionType) {
        whereConditions.push(eq(listingActivityLog.actionType, input.actionType));
      }

      if (input.performedByRole) {
        const validRoles = ['buyer', 'seller', 'admin'];
        if (validRoles.includes(input.performedByRole)) {
          whereConditions.push(eq(listingActivityLog.performedByRole, input.performedByRole as any));
        }
      }

      // Get total count
      const countResult = await db
        .select({ count: count() })
        .from(listingActivityLog)
        .where(and(...whereConditions));

      const total = Number(countResult[0]?.count || 0);

      // Get logs with pagination
      const logs = await db
        .select()
        .from(listingActivityLog)
        .where(and(...whereConditions))
        .orderBy(desc(listingActivityLog.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // Fetch user details for performed_by
      const userIds = logs
        .map((log) => log.performedBy)
        .filter((id): id is string => id !== null && typeof id === 'string');
      
      const userMap = new Map<string, string>();
      
      if (userIds.length > 0) {
        const uniqueUserIds = [...new Set(userIds)];
        const usersData = await db
          .select({ id: users.id, email: users.email })
          .from(users)
          .where(inArray(users.id, uniqueUserIds));
        
        usersData.forEach((user: any) => {
          userMap.set(user.id, (user.email ?? 'unknown') as string);
        });
      }

      return {
        logs: logs.map((log) => {
          let details = null;
          if (log.details) {
            try {
              details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
            } catch (e) {
              details = log.details;
            }
          }
          return {
            id: log.id,
            listingId: log.listingId,
            action: log.action,
            actionType: log.actionType,
            performedBy: log.performedBy,
            performedByRole: log.performedByRole,
            performedByName: log.performedBy ? userMap.get(log.performedBy) : undefined,
            details: details,
            oldValue: null,
            newValue: null,
            createdAt: log.createdAt,
          };
        }),
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  /**
   * Get audit summary/stats
   */
  getAuditSummary: protectedProcedure
    .input(
      z.object({
        days: z.number().int().positive().default(30),
      })
    )
    .output(
      z.object({
        totalActions: z.number(),
        actionsByType: z.record(z.string(), z.number()),
        actionsByRole: z.record(z.string(), z.number()),
        topAdmins: z.array(
          z.object({
            userId: z.string().uuid().nullable(),
            email: z.string(),
            actionCount: z.number(),
            lastAction: z.date(),
          })
        ),
        riskFlags: z.array(
          z.object({
            flag: z.string(),
            count: z.number(),
            severity: z.enum(['low', 'medium', 'high']),
          })
        ),
      })
    )
    .query(async ({ ctx, input }) => {
      await verifyAdminRole(ctx);

      const { start, end } = getDateRange(input.days);

      // Total actions
      const totalResult = await db
        .select({ count: count() })
        .from(listingActivityLog)
        .where(
          and(
            gte(listingActivityLog.createdAt, start),
            lt(listingActivityLog.createdAt, end)
          )
        );

      const totalActions = Number(totalResult[0]?.count || 0);

      // Actions by type
      const actionsByTypeResult = await db
        .select({
          actionType: listingActivityLog.actionType,
          count: count(),
        })
        .from(listingActivityLog)
        .where(
          and(
            gte(listingActivityLog.createdAt, start),
            lt(listingActivityLog.createdAt, end)
          )
        )
        .groupBy(listingActivityLog.actionType);

      const actionsByType: Record<string, number> = {};
      actionsByTypeResult.forEach((item) => {
        actionsByType[item.actionType] = Number(item.count || 0);
      });

      // Actions by role
      const actionsByRoleResult = await db
        .select({
          role: listingActivityLog.performedByRole,
          count: count(),
        })
        .from(listingActivityLog)
        .where(
          and(
            gte(listingActivityLog.createdAt, start),
            lt(listingActivityLog.createdAt, end)
          )
        )
        .groupBy(listingActivityLog.performedByRole);

      const actionsByRole: Record<string, number> = {};
      actionsByRoleResult.forEach((item) => {
        if (item.role) {
          actionsByRole[item.role] = Number(item.count || 0);
        }
      });

      // Top admins
      const topAdminsResult = await db
        .select({
          performedBy: listingActivityLog.performedBy,
          count: count(),
          lastAction: sql<Date>`max(${listingActivityLog.createdAt})`,
        })
        .from(listingActivityLog)
        .where(
          and(
            gte(listingActivityLog.createdAt, start),
            lt(listingActivityLog.createdAt, end),
            eq(listingActivityLog.performedByRole, 'admin')
          )
        )
        .groupBy(listingActivityLog.performedBy)
        .orderBy(desc(count()))
        .limit(5);

      // Fetch user emails
      const adminIds = topAdminsResult
        .map((admin) => admin.performedBy)
        .filter((id): id is string => id !== null && typeof id === 'string');
      const adminMap = new Map<string, string>();
      
      if (adminIds.length > 0) {
        const uniqueAdminIds = [...new Set(adminIds)];
        const adminUsers = await db
          .select({ id: users.id, email: users.email })
          .from(users)
          .where(inArray(users.id, uniqueAdminIds));

        adminUsers.forEach((user: any) => {
          adminMap.set(user.id, (user.email ?? 'Unknown') as string);
        });
      }

      const topAdmins = topAdminsResult.map((admin) => ({
        userId: (admin.performedBy ?? null) as string | null,
        email: (adminMap.get(admin.performedBy as string) ?? 'Unknown') as string,
        actionCount: Number(admin.count || 0),
        lastAction: admin.lastAction instanceof Date ? admin.lastAction : (admin.lastAction ? new Date(admin.lastAction) : new Date()),
      }));

      // Risk flags (suspicious activities)
      const riskFlagsArray: Array<{
        flag: string;
        count: number;
        severity: 'low' | 'medium' | 'high';
      }> = [
        {
          flag: 'Bulk listing rejections',
          count: actionsByType['reject'] || 0,
          severity: ((actionsByType['reject'] ?? 0) > 10 ? 'high' : 'medium') as 'low' | 'medium' | 'high',
        },
        {
          flag: 'Password resets',
          count: actionsByType['password_reset'] || 0,
          severity: ((actionsByType['password_reset'] ?? 0) > 5 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
        },
        {
          flag: 'Permission changes',
          count: actionsByType['role_change'] || 0,
          severity: 'high' as const,
        },
      ].filter((flag) => flag.count > 0);

      return {
        totalActions,
        actionsByType,
        actionsByRole,
        topAdmins,
        riskFlags: riskFlagsArray,
      };
    }),

  /**
   * Log an admin action
   */
  logAction: protectedProcedure
    .input(
      z.object({
        listingId: z.string().uuid(),
        action: z.string(),
        actionType: z.string(),
        details: z.any().optional(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        logId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyAdminRole(ctx);

      // Get seller ID from listing
      const listing = await db
        .select({ sellerId: listings.sellerId })
        .from(listings)
        .where(eq(listings.id, input.listingId));
      const sellerId = listing[0]?.sellerId;
      
      if (!sellerId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Listing or seller not found',
        });
      }

      const logEntry = await db
        .insert(listingActivityLog)
        .values({
          listingId: input.listingId,
          sellerId: sellerId,
          action: input.action,
          actionType: input.actionType,
          performedBy: ctx.user?.id || '',
          performedByRole: (ctx.user?.role && ['buyer', 'seller', 'admin'].includes(ctx.user.role) ? ctx.user.role as 'buyer' | 'seller' | 'admin' : null),
          details: input.details ? JSON.stringify(input.details) : null,
        })
        .returning({ id: listingActivityLog.id });

      return {
        success: true,
        logId: logEntry[0]?.id || '',
      };
    }),

  /**
   * Export audit logs
   */
  exportLogs: protectedProcedure
    .input(
      z.object({
        days: z.number().int().positive().default(30),
        format: z.enum(['csv', 'json']).default('csv'),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        data: z.string(),
        filename: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyAdminRole(ctx);

      const { start, end } = getDateRange(input.days);

      const logs = await db
        .select()
        .from(listingActivityLog)
        .where(
          and(
            gte(listingActivityLog.createdAt, start),
            lt(listingActivityLog.createdAt, end)
          )
        )
        .orderBy(desc(listingActivityLog.createdAt));

      let data = '';
      let filename = `audit-logs-${new Date().toISOString().split('T')[0]}`;

      if (input.format === 'json') {
        data = JSON.stringify(logs, null, 2);
        filename += '.json';
      } else {
        // CSV format
        const headers = [
          'ID',
          'Listing ID',
          'Action',
          'Action Type',
          'Performed By',
          'Role',
          'Created At',
        ];
        const rows = logs.map((log) => [
          log.id,
          log.listingId || '',
          log.action,
          log.actionType,
          log.performedBy,
          log.performedByRole || '',
          log.createdAt,
        ]);

        data =
          headers.join(',') +
          '\n' +
          rows
            .map((row) =>
              row
                .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
                .join(',')
            )
            .join('\n');
        filename += '.csv';
      }

      return {
        success: true,
        data,
        filename,
      };
    }),
});