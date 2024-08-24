import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import type { FullHistory, HistoryItem } from "../../../api/history.ts";
import { getFullHistory } from "../../../api/history.ts";

export const useGetFullHistory = (): UseQueryResult<FullHistory> =>
    useQuery({
        initialData: {
            content: new Map<string, HistoryItem>(),
            playback: [],
        },
        queryFn: getFullHistory,
        queryKey: ["history"],
    });
