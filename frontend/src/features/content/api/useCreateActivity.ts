import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";

import type { Activity } from "../../../api/activity.ts";
import { createActivity } from "../../../api/activity.ts";
import type { Data } from "../../../api/content.ts";
import { queryClient } from "../../../main.tsx";

export const useCreateActivity = (): UseMutationResult<Activity, Error, Activity> =>
    useMutation({
        mutationFn: createActivity,
        onMutate: async (activity) => {
            await queryClient.cancelQueries({ queryKey: ["content"] });

            const content = queryClient.getQueryData<Data>(["content"]);
            content?.groupedContent.set(
                activity.category,
                content.groupedContent.get(activity.category)!.filter((item) => item.id !== activity.contentId),
            );

            queryClient.setQueryData<Data>(["content"], content);

            return content;
        },
        onSettled: async () => {
            await queryClient.invalidateQueries({ queryKey: ["content"] });
        },
    });
