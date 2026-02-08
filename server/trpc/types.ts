import type { TRPCContext } from './context';

/**
 * Helper types for TRPC procedure handlers to avoid implicit any errors
 */

export type ProcedureContext = { ctx: TRPCContext };

export type ProcedureContextAndInput<T = any> = {
  ctx: TRPCContext;
  input: T;
};

export type ProcedureNextFunction = {
  ctx: TRPCContext;
  next: (opts: { ctx: TRPCContext }) => Promise<any>;
};

/**
 * Type for standard procedure handlers with ctx and input
 */
export type ProcedureHandler<TInput = any, TOutput = any> = (opts: {
  ctx: TRPCContext;
  input: TInput;
}) => Promise<TOutput> | TOutput;

/**
 * Type for procedure handlers with only ctx
 */
export type ContextOnlyHandler<TOutput = any> = (opts: {
  ctx: TRPCContext;
}) => Promise<TOutput> | TOutput;

/**
 * Type for procedure handlers with only input
 */
export type InputOnlyHandler<TInput = any, TOutput = any> = (opts: {
  input: TInput;
}) => Promise<TOutput> | TOutput;

/**
 * Middleware function type for procedures
 */
export type MiddlewareFunction = (opts: {
  ctx: TRPCContext;
  next: (opts: { ctx: TRPCContext }) => Promise<any>;
}) => Promise<any>;

/**
 * Type assertion functions to ensure proper typing for handler parameters
 */
export function assertContextAndInput<T>(opts: any): { ctx: TRPCContext; input: T } {
  return opts as { ctx: TRPCContext; input: T };
}

export function assertContext(opts: any): { ctx: TRPCContext } {
  return opts as { ctx: TRPCContext };
}

export function assertInput<T>(opts: any): { input: T } {
  return opts as { input: T };
}

export function assertMiddleware(opts: any): { ctx: TRPCContext; next: (opts: { ctx: TRPCContext }) => Promise<any> } {
  return opts as { ctx: TRPCContext; next: (opts: { ctx: TRPCContext }) => Promise<any> };
}