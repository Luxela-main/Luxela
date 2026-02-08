// This file re-exports the main tRPC client from lib/trpc.ts
// It maintains backward compatibility for code importing from @/lib/_trpc/client
export { trpc, getVanillaTRPCClient, vanillaTrpc, getTRPCClient } from '@/lib/trpc';