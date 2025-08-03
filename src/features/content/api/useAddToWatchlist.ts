import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { addToWatchlist, type AddToWatchlistResponse, Category, Data } from "../../../api/content.ts";
import { queryClient } from "../../../main.tsx";

type AddToWatchlistParams = {
    videoId: string;
    status?: string;
};

export const useAddToWatchlist = (): UseMutationResult<AddToWatchlistResponse, Error, AddToWatchlistParams> =>
    useMutation({
        mutationFn: ({ videoId, status }: AddToWatchlistParams) => addToWatchlist(videoId, status),
        onError: (error: Error) => {
            toast.error(error.message || "Failed to add video to watch later");
        },
        onSuccess: ({ success, video }) => {
            if (!success) {
                toast.error("Failed to add video to watch later");
                return;
            }

            toast.success("Video added to watch later");

            const content = queryClient.getQueryData<Data>(["content"]);
            if (!content) return;

            const newGroupedContent = new Map(content.groupedContent);
            const watchLaterVideos = newGroupedContent.get(Category.watchLater) || [];
            newGroupedContent.set(Category.watchLater, [video, ...watchLaterVideos]);

            queryClient.setQueryData<Data>(["content"], {
                ...content,
                groupedContent: newGroupedContent,
            });
        },
    });
