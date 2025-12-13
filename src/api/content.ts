import { BaseURL } from "./base.ts";

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
    publishedAt?: string;
    thumbnail: string;
    title: string;
    url: string;
    status?: string;
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
    const resp = await fetch(`${BaseURL}/api/content`);
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
        meta: data.meta || {},
    };
};

export const openContent = async (url: string): Promise<void> => {
    const resp = await fetch(`${BaseURL}/api/open-url`, {
        body: JSON.stringify({ url }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
    });

    if (!resp.ok) {
        const errorText = await resp.text();

        throw new Error(errorText || "Failed to open content");
    }
};

export type AddToWatchlistResponse = {
    success: boolean;
    message: string;
    video: Content;
};

export const addToWatchlist = async (videoId: string, status?: string): Promise<AddToWatchlistResponse> => {
    const resp = await fetch(`${BaseURL}/api/add-video`, {
        body: JSON.stringify({ video_id: videoId, status }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
    });

    if (!resp.ok) {
        const errorText = await resp.text();

        throw new Error(errorText || "Failed to add to watchlist");
    }

    return await resp.json();
};

export type VideoStatusItem = {
    video_id: string;
    status: string;
};

export type VideoStatusResult = {
    video_id: string;
    success: boolean;
    message?: string;
};

export type MarkVideoStatusResponse = {
    success: boolean;
    message: string;
    results?: VideoStatusResult[];
};

export enum VideoStatus {
    Watched = "watched",
    Skipped = "skipped",
    WatchLater = "watch_later",
    None = "",
}

export const markVideoStatus = async (videoId: string, status: VideoStatus): Promise<MarkVideoStatusResponse> => {
    const resp = await fetch(`${BaseURL}/api/mark-video-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{ video_id: videoId, status }]),
    });

    if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(errorText || "Failed to mark video status");
    }

    return await resp.json();
};

export const markVideoStatusBatch = async (items: VideoStatusItem[]): Promise<MarkVideoStatusResponse> => {
    const resp = await fetch(`${BaseURL}/api/mark-video-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(items),
    });

    if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(errorText || "Failed to mark video status");
    }

    return await resp.json();
};

export const getContentTriage = async (): Promise<Content[]> => {
    const resp = await fetch(`${BaseURL}/api/content-triage`);
    if (!resp.ok) {
        throw new Error("Failed to fetch content triage");
    }

    const data = await resp.json();
    return data.contentList;
};

export type GetContentByCategoryRequest = {
    category: string;
    limit?: number;
    offset?: number;
    status?: string[];
    excluded_statuses?: string[];
    excluded_video_ids?: string[];
    is_subscribed?: boolean;
    min_ranking?: number;
    start_date?: string;
    end_date?: string;
    include_shorts?: boolean;
    include_blocked?: boolean;
    order_by?: string;
};

export type QueryFilters = {
    status?: string[];
    excluded_statuses?: string[];
    excluded_video_ids?: string[];
    is_subscribed?: boolean;
    min_ranking?: number;
    start_date?: string;
    end_date?: string;
    include_shorts?: boolean;
    include_blocked?: boolean;
    order_by?: string;
    limit: number;
    offset: number;
};

export type GetContentByCategoryResponse = {
    contentList: Content[];
    total: number;
    limit: number;
    offset: number;
    category: string;
    appliedFilter: QueryFilters;
};

export const getCategoryContent = async (
    request: GetContentByCategoryRequest,
): Promise<GetContentByCategoryResponse> => {
    const resp = await fetch(`${BaseURL}/api/content/category`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
    });

    if (!resp.ok) {
        throw new Error(`Failed to fetch content for category: ${request.category}`);
    }

    return await resp.json();
};
