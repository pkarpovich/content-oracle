import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import type { FullHistory } from "../../../api/history.ts";
import { getFullHistory } from "../../../api/history.ts";

export const useGetFullHistory = (): UseQueryResult<FullHistory> =>
    useQuery({
        initialData: {
            groupedByDate: [],
        },
        queryFn: getFullHistory,
        queryKey: ["history"],
    });
