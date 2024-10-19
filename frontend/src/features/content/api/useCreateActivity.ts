import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";

import type { Activity } from "../../../api/activity.ts";
import { ActivityStatus, createActivity } from "../../../api/activity.ts";
import type { Data } from "../../../api/content.ts";
import { queryClient } from "../../../main.tsx";

export const useCreateActivity = (): UseMutationResult<Activity, Error, Activity> =>
    useMutation({
        mutationFn: createActivity,
        onMutate: async (activity: Activity) => {
            await queryClient.cancelQueries({ queryKey: ["content"] });

            const content = queryClient.getQueryData<Data>(["content"]);

            switch (activity.status) {
                case ActivityStatus.blockChannel: {
                    content?.groupedContent.set(
                        activity.category,
                        content.groupedContent
                            .get(activity.category)!
                            .filter((item) => item.artist.id !== activity.channelId),
                    );

                    break;
                }

                case ActivityStatus.completed: {
                    content?.groupedContent.set(
                        activity.category,
                        content.groupedContent.get(activity.category)!.filter((item) => item.id !== activity.videoId),
                    );

                    break;
                }

                default: {
                    throw new Error("Invalid activity status");
                }
            }

            queryClient.setQueryData<Data>(["content"], content);

            return content;
        },
        onSettled: async () => {
            await queryClient.invalidateQueries({ queryKey: ["content"] });
        },
    });
