import { useCallback, useEffect, useMemo, useState } from "react";

const BaseURL = import.meta.env.VITE_API_BASE_URL || window.location.origin;

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

export const useContent = () => {
    const [content, setContent] = useState<Content[]>([]);
    const [error, setError] = useState<Error | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);

        fetch(`${BaseURL}/api/content`)
            .then((res) => res.json())
            .then(setContent)
            .catch(setError)
            .finally(() => setLoading(false));
    }, []);

    const openContent = useCallback(async (url: string) => {
        const resp = await fetch(`${BaseURL}/api/content/open`, {
            body: JSON.stringify({ url }),
            headers: { "Content-Type": "application/json" },
            method: "POST",
        });

        if (!resp.ok) {
            throw new Error("Failed to open content");
        }
    }, []);

    const groupedContent = useMemo<Map<string, Content[]>>(
        () =>
            content.reduce((acc, item) => {
                if (!acc.has(item.category)) {
                    acc.set(item.category, []);
                }

                acc.get(item.category)?.push(item);

                return acc;
            }, new Map()),
        [content],
    );

    return { content, error, groupedContent, loading, openContent };
};
