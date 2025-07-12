import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getCategoryContent, type Data, Category } from "../../../api/content.ts";
import { CONTENT_PAGE_SIZE } from "../../../constants/pagination.ts";

export const useLoadMoreContent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ category, currentCount }: { category: string; currentCount: number }) => {
            return getCategoryContent(category, CONTENT_PAGE_SIZE, currentCount);
        },
        onSuccess: (newContent, { category }) => {
            queryClient.setQueryData(["content"], (oldData: Data) => {
                if (!oldData) return oldData;

                const updatedGroupedContent = new Map(oldData.groupedContent);
                const categoryKey = category as Category;
                const existingContent = updatedGroupedContent.get(categoryKey) || [];
                updatedGroupedContent.set(categoryKey, [...existingContent, ...newContent]);

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