import { useState, useCallback } from "react";
import { Button } from "../../../components/Button.tsx";
import { Typography } from "../../../components/Typography.tsx";
import { formatDate } from "../../../utils/date.ts";
import { GroupedHistoryItem } from "../../../api/history.ts";
import { useGetFullHistory } from "../api/useGetFullHistory.ts";
import style from "./History.module.css";
import { HistoryItem } from "./HistoryItem.tsx";
import { HistoryItemDetails } from "./HistoryItemDetails.tsx";

export const History = () => {
    const { data, fetchNextPage, isFetchingNextPage, isLoading } = useGetFullHistory();
    const [selectedItem, setSelectedItem] = useState<GroupedHistoryItem | null>(null);

    const handleItemClick = useCallback((item: GroupedHistoryItem) => () => {
        setSelectedItem(item);
    }, []);

    const handleClosePopup = useCallback(() => {
        setSelectedItem(null);
    }, []);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!data?.length) {
        return <div>No history data available</div>;
    }

    return (
        <div className={style.container}>
            {data.map((dateGroup) => (
                    <div className={style.dayContainer} key={dateGroup.date}>
                        <div className={style.dayHeader}>
                            <Typography variant="h1" className={style.dayTitle}>
                                {formatDate(dateGroup.date + "T00:00:00")}
                            </Typography>
                        </div>
                        {dateGroup.content.map((item) => (
                            <HistoryItem
                                key={item.content.id}
                                application={item.content.application}
                                artist={item.content.artist}
                                finishTime={item.mostRecentPlayback.finishTime}
                                id={item.content.id}
                                startTime={item.mostRecentPlayback.startTime}
                                thumbnail={item.content.thumbnail}
                                title={item.content.title}
                                onClick={handleItemClick(item)}
                            />
                        ))}
                    </div>
                ))}

            <div className={style.loadMoreContainer}>
                <Button onClick={fetchNextPage} disabled={isFetchingNextPage}>
                    {isFetchingNextPage ? "Loading..." : "Load More"}
                </Button>
            </div>

            {selectedItem && (
                <HistoryItemDetails
                    onClose={handleClosePopup}
                    item={selectedItem}
                />
            )}
        </div>
    );
};
