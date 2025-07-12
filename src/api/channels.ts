import { BaseURL } from "./base.ts";

export type BlockChannelRequest = {
    channel_id: string;
};

export type BlockChannelResponse = {
    success: boolean;
    message: string;
};

export type MarkVideoStatusRequest = {
    video_id: string;
    status: string;
};

export type MarkVideoStatusResponse = {
    success: boolean;
    message: string;
};

export type VideoStatus = "watched" | "skipped" | "";

export const blockChannel = async (channelId: string): Promise<BlockChannelResponse> => {
    const resp = await fetch(`${BaseURL}/api/block-channel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel_id: channelId }),
    });

    if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(errorText || "Failed to block channel");
    }

    return await resp.json();
};

export const markVideoStatus = async (videoId: string, status: VideoStatus): Promise<MarkVideoStatusResponse> => {
    const resp = await fetch(`${BaseURL}/api/mark-video-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_id: videoId, status }),
    });

    if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(errorText || "Failed to mark video status");
    }

    return await resp.json();
};