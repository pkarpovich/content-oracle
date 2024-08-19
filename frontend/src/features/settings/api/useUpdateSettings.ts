import { useMutation } from "@tanstack/react-query";

import type { Settings } from "../../../api/settings.ts";
import { updateSettings } from "../../../api/settings.ts";

export const useUpdateSettings = () =>
    useMutation({
        mutationFn: (settings: Settings) => updateSettings(settings),
        mutationKey: ["settings"],
    });
