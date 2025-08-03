import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { blockChannel } from "../../../api/channels.ts";
import { Content, Data, VideoStatus } from "../../../api/content.ts";
import { queryClient } from "../../../main.tsx";

type BlockChannelParams = {
    channelId: string;
    isContentTriage?: boolean;
};

export const useBlockChannel = () => {
    return useMutation({
        mutationFn: ({ channelId, isContentTriage }: BlockChannelParams) => blockChannel(channelId, isContentTriage),
        onMutate: async ({ channelId, isContentTriage }: BlockChannelParams) => {
            await queryClient.cancelQueries({ queryKey: ["content"] });

            const content = queryClient.getQueryData<Data>(["content"]);

            if (content) {
                for (const [category, items] of content.groupedContent) {
                    const filteredItems = items.filter((item) => item.artist.id !== channelId);
                    content.groupedContent.set(category, filteredItems);
                }

                content.allContent = content.allContent.filter((item) => item.artist.id !== channelId);

                queryClient.setQueryData<Data>(["content"], content);
            }

            if (isContentTriage) {
                const triageContent = queryClient.getQueryData<Content[]>(["content-triage"]);
                if (triageContent) {
                    const filteredTriageContent = triageContent.map((item) => ({
                        ...item,
                        status: item.artist.id === channelId ? VideoStatus.Skipped : item.status,
                    }));
                    queryClient.setQueryData<Content[]>(["content-triage"], filteredTriageContent);
                }
            }

            return content;
        },
        onSuccess: (data) => {
            toast.success(data.message || "Channel blocked successfully");
        },
        onError: (error: Error, _, context) => {
            if (context) {
                queryClient.setQueryData<Data>(["content"], context);
            }
            toast.error(error.message || "Failed to block channel");
        },
    });
};
