import { useEffect, useState } from "react";

const BaseURL = import.meta.env.VITE_API_BASE_URL || window.location.origin;
console.log(BaseURL);

type Content = {
    description: string;
    id: string;
    isLive: boolean;
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

    return { content, error, loading };
};
