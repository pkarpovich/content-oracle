import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { markVideoStatus, VideoStatus } from "../../../api/content.ts";
import { Category, Data } from "../../../api/content.ts";
import { queryClient } from "../../../main.tsx";

type MarkVideoStatusParams = {
    videoId: string;
    status: VideoStatus;
};

export const useMarkVideoStatus = () => {
    return useMutation({
        mutationFn: ({ videoId, status }: MarkVideoStatusParams) => markVideoStatus(videoId, status),
        onMutate: async ({ videoId, status }: MarkVideoStatusParams) => {
            await queryClient.cancelQueries({ queryKey: ["content"] });

            const content = queryClient.getQueryData<Data>(["content"]);
            if (!content) return;

            const video = content.allContent.find((item) => item.id === videoId);
            // DEVNOTE: In content triage we might not have the video in allContent
            if (!video) return;

            const newGroupedContent = new Map(content.groupedContent);

            const currentCategory = video.category;
            const currentCategoryItems = newGroupedContent.get(currentCategory);
            if (currentCategoryItems) {
                const filteredItems = currentCategoryItems.filter((item) => item.id !== videoId);
                newGroupedContent.set(currentCategory, filteredItems);
            }

            let updatedAllContent = content.allContent;
            switch (status) {
                case VideoStatus.WatchLater:
                    updatedAllContent = content.allContent.map((item) =>
                        item.id === videoId ? { ...item, category: Category.watchLater } : item,
                    );

                    const updatedVideo = { ...video, category: Category.watchLater };
                    const watchLaterVideos = newGroupedContent.get(Category.watchLater) || [];
                    newGroupedContent.set(Category.watchLater, [updatedVideo, ...watchLaterVideos]);
                    break;

                case VideoStatus.Watched:
                case VideoStatus.Skipped:
                    // Remove from all categories (already done above)
                    // These videos should not appear in any category
                    break;

                case VideoStatus.None:
                    // Restore to original category
                    const originalCategory = video.category;
                    const categoryVideos = newGroupedContent.get(originalCategory) || [];
                    newGroupedContent.set(originalCategory, [...categoryVideos, video]);
                    break;
            }

            const newContent = {
                ...content,
                allContent: updatedAllContent,
                groupedContent: newGroupedContent,
            };

            queryClient.setQueryData<Data>(["content"], newContent);

            return content;
        },
        onSuccess: (data, { status }) => {
            const statusMessage =
                status === VideoStatus.Watched
                    ? "Video marked as watched"
                    : status === VideoStatus.Skipped
                      ? "Video skipped"
                      : status === VideoStatus.WatchLater
                        ? "Video added to Watch Later"
                        : "Video status cleared";
            toast.success(data.message || statusMessage);
        },
        onError: (error: Error, _, context) => {
            if (context) {
                queryClient.setQueryData<Data>(["content"], context);
            }
            toast.error(error.message || "Failed to mark video status");
        },
    });
};
