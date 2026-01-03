import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../server/trpc/router.ts";

export const trpc = createTRPCReact<AppRouter>();