import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { markVideoStatus, VideoStatus } from "../../../api/channels.ts";
import type { Data } from "../../../api/content.ts";
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

            if (content) {
                // Remove video from UI when marked as watched or skipped
                if (status === "watched" || status === "skipped") {
                    // Remove from all categories
                    for (const [category, items] of content.groupedContent) {
                        const filteredItems = items.filter((item) => item.id !== videoId);
                        content.groupedContent.set(category, filteredItems);
                    }

                    // Remove from allContent array as well
                    content.allContent = content.allContent.filter((item) => item.id !== videoId);

                    queryClient.setQueryData<Data>(["content"], content);
                }
            }

            return content;
        },
        onSuccess: (data, { status }) => {
            const statusMessage = status === "watched" ? "Video marked as watched" : 
                                 status === "skipped" ? "Video skipped" : 
                                 "Video status cleared";
            toast.success(data.message || statusMessage);
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to mark video status");
        },
        onSettled: async () => {
            await queryClient.invalidateQueries({ queryKey: ["content"] });
        },
    });
};