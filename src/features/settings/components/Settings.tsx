import { useCallback, useEffect, useState } from "react";

import type { Rank } from "../../../api/settings.ts";
import { Button } from "../../../components/Button.tsx";
import { Typography } from "../../../components/Typography.tsx";
import { useGetSettings } from "../api/useGetSettings.ts";
import { useUpdateSettings } from "../api/useUpdateSettings.ts";
import style from "./Settings.module.css";
import { YoutubeSettings } from "./YoutubeSettings.tsx";

const InitialRankings = new Map<string, number>();

type SettingsTab = 'youtube' | 'general' | 'notifications';

export const Settings = () => {
    const { data: settings, error, isLoading } = useGetSettings();
    const { mutate: saveSettings } = useUpdateSettings();
    const [ranking, setRankings] = useState<Map<string, number>>(InitialRankings);
    const [activeTab, setActiveTab] = useState<SettingsTab>('youtube');

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

    const renderTabContent = () => {
        switch (activeTab) {
            case 'youtube':
                return settings ? (
                    <YoutubeSettings
                        onRankChange={handleRankChange}
                        ranking={ranking}
                        subscriptions={settings.subscriptions}
                    />
                ) : null;
            case 'general':
                return (
                    <div className={style.tabContent}>
                        <Typography variant="h3">General Settings</Typography>
                        <Typography variant="text">General settings will be available soon.</Typography>
                    </div>
                );
            case 'notifications':
                return (
                    <div className={style.tabContent}>
                        <Typography variant="h3">Notification Settings</Typography>
                        <Typography variant="text">Notification settings will be available soon.</Typography>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className={style.container}>
            <div className={style.header}>
                <Typography variant="h1">Settings</Typography>
            </div>
            
            <div className={style.tabsContainer}>
                <button
                    className={`${style.tab} ${activeTab === 'youtube' ? style.tabActive : ''}`}
                    onClick={() => setActiveTab('youtube')}
                >
                    YouTube Subscriptions
                </button>
                <button
                    className={`${style.tab} ${activeTab === 'general' ? style.tabActive : ''}`}
                    onClick={() => setActiveTab('general')}
                >
                    General
                </button>
                <button
                    className={`${style.tab} ${activeTab === 'notifications' ? style.tabActive : ''}`}
                    onClick={() => setActiveTab('notifications')}
                >
                    Notifications
                </button>
            </div>

            <div className={style.contentContainer}>
                {isLoading ? (
                    <div className={style.loadingState}>
                        <Typography variant="text">Loading...</Typography>
                    </div>
                ) : null}
                {error ? (
                    <div className={style.errorState}>
                        <Typography variant="text">Error: {error.message}</Typography>
                    </div>
                ) : null}
                {renderTabContent()}
            </div>

            {activeTab === 'youtube' && settings ? (
                <div className={style.buttonsContainer}>
                    <Button onClick={handleSave}>Save Changes</Button>
                </div>
            ) : null}
        </div>
    );
};
