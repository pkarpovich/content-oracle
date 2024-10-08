import { BaseURL } from "./base.ts";
import type { Category } from "./content.ts";

export type Activity = {
    category: Category;
    channelId?: string;
    id?: number;
    status: ActivityStatus;
    videoId?: string;
};

export enum ActivityStatus {
    blockChannel = "blockChannel",
    completed = "completed",
}

export const createActivity = async (activity: Activity): Promise<Activity> => {
    const resp = await fetch(`${BaseURL}/api/activity`, {
        body: JSON.stringify(activity),
        headers: { "Content-Type": "application/json" },
        method: "POST",
    });

    if (!resp.ok) {
        throw new Error("Failed to create activity");
    }

    return resp.json();
};
