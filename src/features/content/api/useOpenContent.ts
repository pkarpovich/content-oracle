import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";

import { openContent } from "../../../api/content.ts";

export const useOpenContent = (): UseMutationResult<void, Error, string> =>
    useMutation({
        mutationFn: openContent,
    });
