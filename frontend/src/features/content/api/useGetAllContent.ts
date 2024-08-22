import type { UseSuspenseQueryResult } from "@tanstack/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";

import type { Content } from "../../../api/content.ts";
import { getAllContent } from "../../../api/content.ts";

export const useGetAllContent = (): UseSuspenseQueryResult<Map<string, Content[]>> =>
    useSuspenseQuery({
        queryFn: getAllContent,
        queryKey: ["content"],
    });
