import { useQuery } from "@tanstack/react-query";

import { getContentTriage } from "../../../api/content.ts";

export const useGetContentTriage = () =>
    useQuery({
        queryFn: getContentTriage,
        queryKey: ["content-triage"],
        staleTime: 1000 * 60 * 5,
    });
