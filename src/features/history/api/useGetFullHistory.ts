import { useInfiniteQuery } from "@tanstack/react-query";

import { getFullHistory, GroupedByDateItem } from "../../../api/history.ts";

const DEFAULT_LIMIT = 20;

export const useGetFullHistory = () => {
    return useInfiniteQuery({
        queryKey: ["history"],
        queryFn: ({ pageParam }) => getFullHistory({ limit: pageParam.limit, offset: pageParam.offset }),
        getNextPageParam: (_, allPages) => ({ offset: allPages.length * DEFAULT_LIMIT, limit: DEFAULT_LIMIT }),
        initialPageParam: { offset: 0, limit: DEFAULT_LIMIT },
        select: (data) => {
            console.log(data.pages.flatMap((page) => page.groupedByDate));
            return data.pages
                .flatMap((page) => page.groupedByDate)
                .reduce((acc, dateGroup) => {
                    if (acc.findIndex((item) => item.date === dateGroup.date) === -1) {
                        acc.push({
                            date: dateGroup.date,
                            content: [],
                        });
                    }

                    const existingGroup = acc.find((item) => item.date === dateGroup.date);
                    if (existingGroup) {
                        existingGroup.content.push(...dateGroup.content);
                    }

                    return acc;
                }, [] as GroupedByDateItem[]);
        },
    });
};
