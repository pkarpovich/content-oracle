import { useCallback } from "react";

import { BaseURL } from "../../../api/base.ts";
import { Button } from "../../../components/Button.tsx";
import { Typography } from "../../../components/Typography.tsx";
import { useCleanSettings } from "../api/useCleanSettings.ts";
import styles from "./GeneralSettings.module.css";

export const GeneralSettings = () => {
    const { mutate: cleanSettings } = useCleanSettings();

    const handleOpenYoutubeAuth = useCallback(() => {
        open(`${BaseURL}/api/settings/auth/youtube`);
    }, []);

    const handleOpenTwitchAuth = useCallback(() => {
        open(`${BaseURL}/api/settings/auth/twitch`);
    }, []);

    return (
        <div className={styles.container}>
            <Typography variant="h1">General Settings</Typography>
            <div className={styles.buttonsContainer}>
                <div>
                    <Button onClick={cleanSettings}>Reset YouTube Settings</Button>
                </div>
                <div>
                    <Button onClick={handleOpenYoutubeAuth}>Authorize Youtube Client</Button>
                </div>
                <div>
                    <Button onClick={handleOpenTwitchAuth}>Authorize Twitch Client</Button>
                </div>
            </div>
        </div>
    );
};
