import type { UseSuspenseQueryResult } from "@tanstack/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";

import type { Category, Content } from "../../../api/content.ts";
import { getAllContent } from "../../../api/content.ts";

export const useGetAllContent = (refetchKey: string): UseSuspenseQueryResult<Map<Category, Content[]>> =>
    useSuspenseQuery({
        queryFn: getAllContent,
        queryKey: ["content", refetchKey],
    });
