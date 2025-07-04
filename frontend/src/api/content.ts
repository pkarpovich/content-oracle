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
    continueWatching = "Continue Watching",
    unsubscribedChannels = "Unsubscribed Channels",
    youTubeSuggestions = "YouTube Suggestions",
    watchLater = "Watch Later",
}

export const categoryToHash = (category: Category): string => category.replace(" ", "-").toLowerCase();

export type CategoryMeta = {
    total: number;
    hasMore: boolean;
};

export type Data = {
    allContent: Content[];
    groupedContent: Map<Category, Content[]>;
    meta: Record<string, CategoryMeta>;
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
        groupedContent,
        meta: data.meta || {}
    };
};

export const openContent = async (url: string): Promise<void> => {
    const resp = await fetch(`${HubBaseURL}/api/open-url`, {
        body: JSON.stringify({ url }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
    });

    if (!resp.ok) {
        const errorText = await resp.text();

        throw new Error(errorText || "Failed to open content");
    }
};

export const addToWatchlist = async (videoId: string): Promise<void> => {
    const resp = await fetch(`${HubBaseURL}/api/mark-video-status`, {
        body: JSON.stringify({ video_id: videoId, status: "watch_later" }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
    });

    if (!resp.ok) {
        const errorText = await resp.text();

        throw new Error(errorText || "Failed to add to watchlist");
    }
};

export const getContentTriage = async (): Promise<Content[]> => {
    const resp = await fetch(`${HubBaseURL}/api/content-triage`);
    if (!resp.ok) {
        throw new Error("Failed to fetch content triage");
    }

    const data = await resp.json();
    return data.contentList || [];
};
