import { BaseURL } from "./base.ts";

export type Content = {
    category: string;
    description: string;
    id: string;
    isLive: boolean;
    position: number;
    thumbnail: string;
    title: string;
    url: string;
};

export const getAllContent = async (): Promise<Map<string, Content[]>> => {
    const resp = await fetch(`${BaseURL}/api/content`);
    if (!resp.ok) {
        throw new Error("Failed to fetch content");
    }

    const data = await resp.json();

    return data.reduce((acc: Map<string, Content[]>, item: Content) => {
        if (!acc.has(item.category)) {
            acc.set(item.category, []);
        }

        acc.get(item.category)?.push(item);

        return acc;
    }, new Map());
};

export const openContent = async (url: string): Promise<void> => {
    const resp = await fetch(`${BaseURL}/api/content/open`, {
        body: JSON.stringify({ url }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
    });

    if (!resp.ok) {
        throw new Error("Failed to open content");
    }
};
