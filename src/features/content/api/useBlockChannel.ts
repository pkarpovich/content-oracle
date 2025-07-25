import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { blockChannel } from "../../../api/channels.ts";
import type { Data } from "../../../api/content.ts";
import { queryClient } from "../../../main.tsx";

export const useBlockChannel = () => {
    return useMutation({
        mutationFn: blockChannel,
        onMutate: async (channelId: string) => {
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