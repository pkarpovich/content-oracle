import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";

import { addToWatchlist } from "../../../api/content.ts";
import { queryClient } from "../../../main.tsx";

export const useAddToWatchlist = (): UseMutationResult<void, Error, string> =>
    useMutation({
        mutationFn: addToWatchlist,
        onSettled: async () => {
            await queryClient.invalidateQueries({ queryKey: ["content"] });
        },
    });
