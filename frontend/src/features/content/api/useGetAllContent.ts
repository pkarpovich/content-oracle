import type { UseSuspenseQueryResult } from "@tanstack/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";

import type { Data } from "../../../api/content.ts";
import { getAllContent } from "../../../api/content.ts";

export const useGetAllContent = (refetchKey: string): UseSuspenseQueryResult<Data> =>
    useSuspenseQuery({
        queryFn: getAllContent,
        queryKey: ["content", refetchKey],
    });
