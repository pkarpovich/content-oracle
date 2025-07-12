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

export const updateSettings = async (_: Settings): Promise<void> => {
    // TODO: Implement the update logic
};
