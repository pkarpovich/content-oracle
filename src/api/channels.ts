import { BaseURL } from "./base.ts";

export type BlockChannelRequest = {
    channel_id: string;
    isContentTriage?: boolean;
};

export type BlockChannelResponse = {
    success: boolean;
    message: string;
};

export const blockChannel = async (channelId: string, isContentTriage?: boolean): Promise<BlockChannelResponse> => {
    const resp = await fetch(`${BaseURL}/api/block-channel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel_id: channelId, isContentTriage }),
    });

    if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(errorText || "Failed to block channel");
    }

    return await resp.json();
};
