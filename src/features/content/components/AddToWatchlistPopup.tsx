import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import type { FormEvent } from "react";
import { useCallback } from "react";
import { z } from "zod";

import { BottomSheet } from "../../../components/BottomSheet.tsx";
import { Button } from "../../../components/Button.tsx";
import { Input } from "../../../components/Input.tsx";
import { Typography } from "../../../components/Typography.tsx";
import { extractYouTubeVideoId } from "../../../utils/youtube.ts";
import { useAddToWatchlist } from "../api/useAddToWatchlist.ts";
import styles from "./AddToWatchlistPopup.module.css";
import { VideoStatus } from "../../../api/content.ts";

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

export const AddToWatchlistPopup = ({ isOpen, onClose }: Props) => {
    const { mutate } = useAddToWatchlist();

    const form = useForm({
        defaultValues: {
            url: "",
        },
        onSubmit: ({ formApi, value }) => {
            const videoId = extractYouTubeVideoId(value.url);
            if (videoId) {
                mutate({
                    status: VideoStatus.WatchLater,
                    videoId,
                });
                formApi.reset();
                onClose();
            }
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
        <BottomSheet isOpen={isOpen} onClose={onClose}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <Typography variant="h3">Add to Watchlist</Typography>
                    <Typography className={styles.description} variant="text">
                        Enter a YouTube URL or video ID to add it to your watchlist
                    </Typography>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <form.Field
                        children={({ handleChange, state }) => (
                            <Input
                                error={state.meta.errors.join(", ")}
                                label="YouTube URL or Video ID"
                                onChange={handleChange}
                                placeholder="https://youtube.com/watch?v=... or video ID"
                                value={state.value}
                            />
                        )}
                        name="url"
                        validators={{
                            onChange: z
                                .string()
                                .refine(
                                    (url) => extractYouTubeVideoId(url) !== null,
                                    "Please enter a valid YouTube URL or video ID",
                                ),
                        }}
                    />
                    <Button className={styles.button} disabled={!canSubmit} loading={isSubmitting} type="submit">
                        Add to Watchlist
                    </Button>
                </form>
            </div>
        </BottomSheet>
    );
};
