import { useQuery } from "@tanstack/react-query";

import { getContentTriage } from "../../../api/content.ts";

export const useGetContentTriage = () => {
    return useQuery({
        queryKey: ["content-triage"],
        queryFn: getContentTriage,
        staleTime: 1000 * 60 * 5,
    });
};