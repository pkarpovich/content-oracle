import { formatDate as fnsFormatDate, formatDistanceToNow } from "date-fns";

const DefaultLayout = "EEEE, MMM d, yyyy";

export const formatDate = (timestamp: string, layout: string = DefaultLayout): string => {
    const date = new Date(timestamp);

    return fnsFormatDate(date, layout);
};

export const formatRelativeTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
};
