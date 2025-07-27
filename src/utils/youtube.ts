export const extractYouTubeVideoId = (url: string): null | string => {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
        /youtube\.com\/shorts\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }

    if (url.length === 11 && /^[a-zA-Z0-9_-]+$/.test(url)) {
        return url;
    }

    return null;
};

const extractTwitchChannel = (url: string): null | string => {
    const patterns = [/twitch\.tv\/([^\/\s?]+)/, /static-cdn\.jtvnw\.net\/previews-ttv\/live_user_([^-]+)/];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }

    return null;
};

const getTwitchThumbnail = (channelOrUrl: string) => {
    const channel = extractTwitchChannel(channelOrUrl) || channelOrUrl;

    if (!channel) {
        return null;
    }

    const lowerCaseChannel = channel.toLowerCase();
    const baseUrl = `https://static-cdn.jtvnw.net/previews-ttv/live_user_${lowerCaseChannel}`;

    return {
        desktop: `${baseUrl}-480x270.jpg`,
        fallback: `${baseUrl}-480x270.jpg`,
        mobile: `${baseUrl}-320x180.jpg`,
    };
};

export const getYouTubeThumbnail = (videoIdOrUrl: string) => {
    const videoId = extractYouTubeVideoId(videoIdOrUrl) || videoIdOrUrl;

    if (!videoId) {
        return null;
    }

    const baseUrl = `https://i3.ytimg.com/vi/${videoId}`;

    return {
        full: `${baseUrl}/maxresdefault.jpg`,
        desktop: `${baseUrl}/mqdefault.jpg`,
        fallback: `${baseUrl}/hqdefault.jpg`,
        mobile: `${baseUrl}/mqdefault.webp`,
    };
};

export const getVideoThumbnail = (urlOrId: string) => {
    if (urlOrId.includes("twitch.tv") || urlOrId.includes("jtvnw.net")) {
        return getTwitchThumbnail(urlOrId);
    }

    return getYouTubeThumbnail(urlOrId);
};
