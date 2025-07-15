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

export const getFullHistory = async (): Promise<FullHistory> => {
    const resp = await fetch(`${BaseURL}/api/history`, {
        method: "GET",
    });

    if (!resp.ok) {
        throw new Error("Failed to fetch history");
    }

    const data = await resp.json();

    return {
        groupedByDate: data.groupedByDate,
    };
};
