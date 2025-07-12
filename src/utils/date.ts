import { formatDate as fnsFormatDate } from "date-fns";

const DefaultLayout = "EEEE, MMM d, yyyy";

export const formatDate = (timestamp: string, layout: string = DefaultLayout): string => {
    const date = new Date(timestamp);

    return fnsFormatDate(date, layout);
};
