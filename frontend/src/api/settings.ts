import { BaseURL } from "./base.ts";

export type YoutubeSubscription = {
    channelId: string;
    name: string;
    previewUrl: string;
    rank: number;
    url: string;
};

export type Rank = {
    id: string;
    rank: number;
};

export type Settings = {
    ranking: Rank[];
    subscriptions: YoutubeSubscription[];
};

export const getSettings = async (): Promise<Settings> => {
    const resp = await fetch(`${BaseURL}/api/settings`);
    if (!resp.ok) {
        throw new Error("Failed to fetch settings");
    }

    return resp.json();
};

export const updateSettings = async (settings: Settings): Promise<void> => {
    const resp = await fetch(`${BaseURL}/api/settings`, {
        body: JSON.stringify(settings),
        headers: { "Content-Type": "application/json" },
        method: "POST",
    });

    if (!resp.ok) {
        throw new Error("Failed to update settings");
    }
};

export const cleanSettings = async (): Promise<void> => {
    const resp = await fetch(`${BaseURL}/api/settings`, {
        method: "DELETE",
    });

    if (!resp.ok) {
        throw new Error("Failed to clean settings");
    }
};
