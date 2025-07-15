import { Typography } from "../../../components/Typography.tsx";
import { formatDate } from "../../../utils/date.ts";
import { useGetFullHistory } from "../api/useGetFullHistory.ts";
import style from "./History.module.css";
import { HistoryItem } from "./HistoryItem.tsx";

export const History = () => {
    const { data } = useGetFullHistory();

    if (!data) {
        return <div>Loading...</div>;
    }

    return (
        <div className={style.container}>
            {data.groupedByDate.map((dateGroup) => (
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
                            url={item.content.url}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
};
