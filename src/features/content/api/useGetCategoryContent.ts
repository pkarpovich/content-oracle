import { useQuery } from "@tanstack/react-query";
import { getCategoryContent } from "../../../api/content.ts";

export const useGetCategoryContent = (category: string, limit: number = 50, offset: number = 0) => {
    return useQuery({
        queryKey: ["categoryContent", category, limit, offset],
        queryFn: () => getCategoryContent(category, limit, offset),
        staleTime: 5 * 60 * 1000, // 5 minutes
        enabled: Boolean(category),
    });
};