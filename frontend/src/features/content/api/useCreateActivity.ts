import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";

import type { Activity } from "../../../api/activity.ts";
import { createActivity } from "../../../api/activity.ts";

export const useCreateActivity = (onSuccess: () => void): UseMutationResult<Activity, Error, Activity> =>
    useMutation({
        mutationFn: createActivity,
        onSuccess,
    });
