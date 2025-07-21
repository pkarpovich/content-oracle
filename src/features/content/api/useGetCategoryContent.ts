import { useQuery } from "@tanstack/react-query";
import { getCategoryContent, type GetContentByCategoryRequest, type GetContentByCategoryResponse } from "../../../api/content.ts";

export const useGetCategoryContent = (request: GetContentByCategoryRequest) => {
    return useQuery<GetContentByCategoryResponse>({
        queryKey: ["categoryContent", request],
        queryFn: () => getCategoryContent(request),
        staleTime: 5 * 60 * 1000, // 5 minutes
        enabled: Boolean(request.category),
    });
};