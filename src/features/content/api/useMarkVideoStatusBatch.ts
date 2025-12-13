import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { markVideoStatusBatch, VideoStatusItem, VideoStatus } from "../../../api/content.ts";
import { queryClient } from "../../../main.tsx";

type MarkVideoStatusBatchParams = {
    items: Array<{ videoId: string; status: VideoStatus }>;
};

export const useMarkVideoStatusBatch = () => {
    return useMutation({
        mutationFn: ({ items }: MarkVideoStatusBatchParams) => {
            const apiItems: VideoStatusItem[] = items.map((item) => ({
                video_id: item.videoId,
                status: item.status,
            }));
            return markVideoStatusBatch(apiItems);
        },
        onSuccess: (data, { items }) => {
            queryClient.invalidateQueries({ queryKey: ["content"] });
            queryClient.invalidateQueries({ queryKey: ["content-triage"] });
            toast.success(data.message || `Processed ${items.length} videos`);
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to mark video status");
        },
    });
};
