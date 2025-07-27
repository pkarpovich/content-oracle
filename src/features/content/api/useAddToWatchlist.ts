import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { addToWatchlist } from "../../../api/content.ts";

type AddToWatchlistParams = {
    originalVideoId: string;
    videoId: string;
};

export const useAddToWatchlist = (): UseMutationResult<void, Error, AddToWatchlistParams> =>
    useMutation({
        mutationFn: ({ videoId }: AddToWatchlistParams) => addToWatchlist(videoId),
        onError: (error: Error) => {
            toast.error(error.message || "Failed to add video to watch later");
        },
        onSuccess: () => {
            toast.success("Video added to watch later");
        },
    });
