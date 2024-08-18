import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import type { Content } from "../../../api/content.ts";
import { getAllContent } from "../../../api/content.ts";

export const useGetAllContent = (): UseQueryResult<Map<string, Content[]>> =>
    useQuery({
        initialData: [],
        queryFn: getAllContent,
        queryKey: ["content"],
        select: (content) =>
            content.reduce((acc, item) => {
                if (!acc.has(item.category)) {
                    acc.set(item.category, []);
                }

                acc.get(item.category)?.push(item);

                return acc;
            }, new Map()),
    });
