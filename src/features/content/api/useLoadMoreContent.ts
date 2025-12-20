import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getCategoryContent, type Data, Category, type Content, type GetContentByCategoryRequest } from "../../../api/content.ts";
import { CONTENT_PAGE_SIZE } from "../../../constants/pagination.ts";

type LoadMoreParams = {
    category: string;
    currentCount: number;
    request?: GetContentByCategoryRequest;
};

type LoadMoreResult = {
    content: Content[];
    hasMore: boolean;
};

export const useLoadMoreContent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ category, currentCount, request }: LoadMoreParams): Promise<LoadMoreResult> => {
            const loadMoreRequest: GetContentByCategoryRequest = request
                ? { ...request, offset: currentCount, limit: CONTENT_PAGE_SIZE }
                : { category, limit: CONTENT_PAGE_SIZE, offset: currentCount };

            const response = await getCategoryContent(loadMoreRequest);
            return {
                content: response.contentList,
                hasMore: response.offset + response.limit < response.total
            };
        },
        onSuccess: (result, { category, request }) => {
            if (request) {
                return;
            }

            queryClient.setQueryData(["content"], (oldData: Data) => {
                if (!oldData) return oldData;

                const updatedGroupedContent = new Map(oldData.groupedContent);
                const categoryKey = category as Category;
                const existingContent = updatedGroupedContent.get(categoryKey) || [];
                updatedGroupedContent.set(categoryKey, [...existingContent, ...result.content]);

                const updatedMeta = {
                    ...oldData.meta,
                    [category]: {
                        ...oldData.meta[category],
                        hasMore: result.hasMore
                    }
                };

                return {
                    ...oldData,
                    groupedContent: updatedGroupedContent,
                    allContent: [...oldData.allContent, ...result.content],
                    meta: updatedMeta
                };
            });
        },
    });
};