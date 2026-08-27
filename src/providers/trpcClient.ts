import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import { QueryClient } from "@tanstack/react-query";
import superjson from "superjson";
import type { AppRouter } from "../../api/router";

// Split out of trpc.tsx: that file exports the TRPCProvider component, and Vite Fast Refresh
// only hot-reloads a file if it exports components only — mixing this client/hook object in
// there defeated Fast Refresh for the whole provider file.
export const trpc = createTRPCReact<AppRouter>();

export const queryClient = new QueryClient();
export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});
