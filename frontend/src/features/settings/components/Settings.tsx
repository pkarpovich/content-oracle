import { useCallback, useEffect, useState } from "react";

import type { Rank } from "../../../api/settings.ts";
import { Button } from "../../../components/Button.tsx";
import { useGetSettings } from "../api/useGetSettings.ts";
import { useUpdateSettings } from "../api/useUpdateSettings.ts";
import { GeneralSettings } from "./GeneralSettings.tsx";
import style from "./Settings.module.css";
import { YoutubeSettings } from "./YoutubeSettings.tsx";

const InitialRankings = new Map<string, number>();

export const Settings = () => {
    const { data: settings, error, isLoading } = useGetSettings();
    const { mutate: saveSettings } = useUpdateSettings();
    const [ranking, setRankings] = useState<Map<string, number>>(InitialRankings);

    useEffect(() => {
        if (!settings) {
            return;
        }

        setRankings(
            settings.ranking.reduce((acc: Map<string, number>, rank: Rank) => {
                acc.set(rank.id, rank.rank);
                return acc;
            }, new Map()),
        );
    }, [settings]);

    const handleRankChange = useCallback((channelId: string, newRank: number) => {
        setRankings((prev) => {
            const newRankings = new Map(prev);
            newRankings.set(channelId, newRank);
            return newRankings;
        });
    }, []);

    const handleSave = useCallback(() => {
        if (!settings) {
            return;
        }

        saveSettings({
            ranking: Array.from(ranking.entries()).map(([id, rank]) => ({ id, rank })),
            subscriptions: settings.subscriptions,
        });
    }, [ranking, saveSettings, settings]);

    return (
        <div className={style.container}>
            <GeneralSettings />
            {isLoading ? <div>Loading...</div> : null}
            {error ? <div>Error: {error.message}</div> : null}
            {settings ? (
                <YoutubeSettings
                    onRankChange={handleRankChange}
                    ranking={ranking}
                    subscriptions={settings.subscriptions}
                />
            ) : null}
            <div className={style.buttonsContainer}>
                <Button onClick={handleSave}>Save</Button>
            </div>
        </div>
    );
};
