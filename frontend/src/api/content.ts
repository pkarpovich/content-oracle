import {BaseURL, HubBaseURL} from "./base.ts";

export type Artist = {
    id: string;
    name: string;
};

export type Content = {
    artist: Artist;
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
    youTubeWatchlist = "YouTube Watchlist",
}

export const categoryToHash = (category: Category): string => category.replace(" ", "-").toLowerCase();

export type Data = {
    allContent: Content[];
    groupedContent: Map<Category, Content[]>;
};

export const getAllContent = async (): Promise<Data> => {
    const resp = await fetch(`${HubBaseURL}/api/content`);
    if (!resp.ok) {
        throw new Error("Failed to fetch content");
    }

    const data = await resp.json();

    const groupedContent = data.contentList.reduce((acc: Map<Category, Content[]>, item: Content) => {
        if (!acc.has(item.category)) {
            acc.set(item.category, []);
        }

        acc.get(item.category)?.push(item);

        return acc;
    }, new Map());

    return { 
        allContent: data.contentList || [],
        groupedContent 
    };
};

export const openContent = async (url: string): Promise<void> => {
    const resp = await fetch(`${BaseURL}/api/content/open`, {
        body: JSON.stringify({ url }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
    });

    if (!resp.ok) {
        const errorText = await resp.text();

        throw new Error(errorText || "Failed to open content");
    }
};

export const addToWatchlist = async (url: string): Promise<void> => {
    const resp = await fetch(`${BaseURL}/api/watchlist/youtube`, {
        body: JSON.stringify({ youtubeUrl: url }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
    });

    if (!resp.ok) {
        const errorText = await resp.text();

        throw new Error(errorText || "Failed to add to watchlist");
    }
};
