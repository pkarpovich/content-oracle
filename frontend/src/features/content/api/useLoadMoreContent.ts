import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getCategoryContent } from "../../../api/content.ts";
import { CONTENT_PAGE_SIZE } from "../../../constants/pagination.ts";

export const useLoadMoreContent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ category, currentCount }: { category: string; currentCount: number }) => {
            return getCategoryContent(category, CONTENT_PAGE_SIZE, currentCount);
        },
        onSuccess: (newContent, { category }) => {
            queryClient.setQueryData(["content"], (oldData: any) => {
                if (!oldData) return oldData;

                const updatedGroupedContent = new Map(oldData.groupedContent);
                const existingContent = updatedGroupedContent.get(category) || [];
                updatedGroupedContent.set(category, [...existingContent, ...newContent]);

                const updatedMeta = {
                    ...oldData.meta,
                    [category]: {
                        ...oldData.meta[category],
                        hasMore: newContent.length === CONTENT_PAGE_SIZE
                    }
                };

                return {
                    ...oldData,
                    groupedContent: updatedGroupedContent,
                    allContent: [...oldData.allContent, ...newContent],
                    meta: updatedMeta
                };
            });
        },
    });
};