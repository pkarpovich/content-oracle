import { BaseURL } from "./base.ts";

export type Content = {
    artist: string;
    category: Category;
    description: string;
    id: string;
    isLive: boolean;
    position: number;
    thumbnail: string;
    title: string;
    url: string;
};

export enum Category {
    liveStreams = "Live Streams",
    unsubscribedChannels = "Unsubscribed Channels",
    youtubeHistory = "YouTube History",
    youTubeSuggestions = "YouTube Suggestions",
}

export const categoryToHash = (category: Category): string => category.replace(" ", "-").toLowerCase();

export const getAllContent = async (): Promise<Map<Category, Content[]>> => {
    const resp = await fetch(`${BaseURL}/api/content`);
    if (!resp.ok) {
        throw new Error("Failed to fetch content");
    }

    const data = await resp.json();

    return data.reduce((acc: Map<Category, Content[]>, item: Content) => {
        if (!acc.has(item.category)) {
            acc.set(item.category, []);
        }

        acc.get(item.category)?.push(item);

        return acc;
    }, new Map());
};

export const openContent = async (url: string): Promise<void> => {
    const resp = await fetch(`${BaseURL}/api/content/open`, {
        body: JSON.stringify({ url }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
    });

    if (!resp.ok) {
        throw new Error("Failed to open content");
    }
};
