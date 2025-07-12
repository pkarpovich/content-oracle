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
