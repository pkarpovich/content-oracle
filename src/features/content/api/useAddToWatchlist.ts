import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { addToWatchlist } from "../../../api/content.ts";
import type { Data } from "../../../api/content.ts";
import { Category } from "../../../api/content.ts";
import { queryClient } from "../../../main.tsx";

type AddToWatchlistParams = {
    videoId: string;
    originalVideoId: string;
};

export const useAddToWatchlist = (): UseMutationResult<void, Error, AddToWatchlistParams> =>
    useMutation({
        mutationFn: ({ videoId }: AddToWatchlistParams) => addToWatchlist(videoId),
        onMutate: async ({ originalVideoId }: AddToWatchlistParams) => {
            await queryClient.cancelQueries({ queryKey: ["content"] });

            const content = queryClient.getQueryData<Data>(["content"]);

            if (content) {
                let videoToMove = null;

                // Find and remove video from current category
                for (const [category, items] of content.groupedContent) {
                    const videoIndex = items.findIndex((item) => item.id === originalVideoId);
                    if (videoIndex !== -1) {
                        videoToMove = items[videoIndex];
                        // Remove from current category
                        const filteredItems = items.filter((item) => item.id !== originalVideoId);
                        content.groupedContent.set(category, filteredItems);
                        break;
                    }
                }

                if (videoToMove) {
                    // Update video category to watch later
                    const watchLaterVideo = {
                        ...videoToMove,
                        category: Category.watchLater
                    };

                    // Add to watch later category
                    const watchLaterItems = content.groupedContent.get(Category.watchLater) || [];
                    content.groupedContent.set(Category.watchLater, [watchLaterVideo, ...watchLaterItems]);

                    // Update allContent array
                    content.allContent = content.allContent.filter((item) => item.id !== originalVideoId);
                    content.allContent.push(watchLaterVideo);

                    queryClient.setQueryData<Data>(["content"], content);
                }
            }

            return content;
        },
        onSuccess: () => {
            toast.success("Video added to watch later");
        },
        onError: (error: Error, variables, context) => {
            // Rollback optimistic update on error
            if (context) {
                queryClient.setQueryData<Data>(["content"], context);
            }
            toast.error(error.message || "Failed to add video to watch later");
        },
    });
