import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import type { FormEvent } from "react";
import { useCallback } from "react";
import { z } from "zod";

import { Button } from "../../../components/Button.tsx";
import { Input } from "../../../components/Input.tsx";
import { Popup } from "../../../components/Popup.tsx";
import { useOpenContent } from "../api/useOpenContent.ts";

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

export const SendToTvPopupPopup = ({ isOpen, onClose }: Props) => {
    const { mutateAsync } = useOpenContent();

    const form = useForm({
        defaultValues: {
            url: "",
        },
        onSubmit: async ({ formApi, value }) => {
            await mutateAsync(value.url);
            formApi.reset();
            onClose();
        },
        validatorAdapter: zodValidator(),
    });

    const handleSubmit = useCallback(
        (e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
        },
        [form],
    );

    const [canSubmit, isSubmitting] = form.useStore((state) => [state.canSubmit, state.isSubmitting]);

    return (
        <Popup isOpen={isOpen} onClose={onClose} title="Send to Apple TV">
            <form onSubmit={handleSubmit}>
                <form.Field
                    children={({ handleChange, state }) => (
                        <Input
                            error={state.meta.errors.join(", ")}
                            label="Url"
                            onChange={handleChange}
                            value={state.value}
                        />
                    )}
                    name="url"
                    validators={{
                        onChange: z.string().url(),
                    }}
                />
                <Button disabled={!canSubmit} loading={isSubmitting} type="submit">
                    Send
                </Button>
            </form>
        </Popup>
    );
};
