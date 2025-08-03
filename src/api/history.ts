import { BaseURL } from "./base.ts";

export enum Applications {
    infuse = "Infuse (com.firecore.infuse)",
    kinopub = "MicroIPTV (octavian.microiptv)",
    netflix = "Netflix (com.netflix.Netflix)",
    podcasts = "Overcast (com.apple.TVAirPlay)",
    twitch = "VLC (org.videolan.vlc-ios)",
    viaplay = "Viaplay (se.harbourfront.viasatondemand)",
    youtube = "YouTube (com.google.ios.youtube)",
}

export type HistoryItem = {
    application: Applications;
    artist: string;
    id: string;
    publishedAt: string;
    thumbnail: string;
    title: string;
    url: string;
};

export type Playback = {
    contentId: string;
    finishTime: string;
    startTime: string;
};

export type GroupedHistoryItem = {
    content: HistoryItem;
    mostRecentPlayback: Playback;
    allPlaybacks: Playback[];
};

export type GroupedByDateItem = {
    date: string;
    content: GroupedHistoryItem[];
};

export type FullHistory = {
    groupedByDate: GroupedByDateItem[];
};

export type GetHistoryParams = {
    limit?: number;
    offset?: number;
};

export const getFullHistory = async (params?: GetHistoryParams): Promise<FullHistory> => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.offset) searchParams.set("offset", params.offset.toString());
    
    const url = `${BaseURL}/api/history${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    
    const resp = await fetch(url, {
        method: "GET",
    });

    if (!resp.ok) {
        throw new Error("Failed to fetch history");
    }

    const data = await resp.json();

    return {
        groupedByDate: data.groupedByDate || [],
    };
};
