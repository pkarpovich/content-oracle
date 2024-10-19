import "./index.css";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { toast } from "react-toastify";

import { routeTree } from "./routeTree.gen.ts";

const router = createRouter({ routeTree });
export const queryClient = new QueryClient({
    mutationCache: new MutationCache({
        onError: (error) => {
            toast.error(`API Mutation Error: ${error.message}`);
        },
    }),
    queryCache: new QueryCache({
        onError: (error) => {
            toast.error(`API Error: ${error.message}`);
        },
    }),
});

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
        </QueryClientProvider>
    </StrictMode>,
);
