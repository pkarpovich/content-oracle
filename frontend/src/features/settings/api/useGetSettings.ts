import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import type { Settings } from "../../../api/settings.ts";
import { getSettings } from "../../../api/settings.ts";

export const useGetSettings = (): UseQueryResult<Settings> =>
    useQuery({
        queryFn: getSettings,
        queryKey: ["settings"],
    });
