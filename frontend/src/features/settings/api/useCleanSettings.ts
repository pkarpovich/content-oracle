import { useMutation } from "@tanstack/react-query";

import { cleanSettings } from "../../../api/settings.ts";

export const useCleanSettings = () =>
    useMutation({
        mutationFn: () => cleanSettings(),
        mutationKey: ["settings"],
    });
