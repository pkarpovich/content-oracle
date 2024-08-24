import { BaseURL } from "./base.ts";

export enum Applications {
    Infuse = "Infuse (com.firecore.infuse)",
    Kinopub = "MicroIPTV (octavian.microiptv)",
    Netflix = "Netflix (com.netflix.Netflix)",
    Podcasts = "Overcast (com.apple.TVAirPlay)",
    Twitch = "VLC (org.videolan.vlc-ios)",
    Viaplay = "Viaplay (se.harbourfront.viasatondemand)",
    Youtube = "YouTube (com.google.ios.youtube)",
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
    id: string;
    startTime: string;
};

export type FullHistory = {
    content: Map<string, HistoryItem>;
    playback: Playback[];
};

export const getFullHistory = async (): Promise<FullHistory> => {
    const resp = await fetch(`${BaseURL}/api/history`, {
        method: "GET",
    });

    if (!resp.ok) {
        throw new Error("Failed to fetch history");
    }

    const data = await resp.json();

    const content = data.items.reduce((acc: Map<string, HistoryItem>, item: HistoryItem) => {
        acc.set(item.id, item);
        return acc;
    }, new Map());

    return {
        content,
        playback: data.playback,
    };
};
