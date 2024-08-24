import { Fragment, useMemo } from "react";

import type { Playback } from "../../../api/history.ts";
import { Row } from "../../../components/row/Row.tsx";
import { Typography } from "../../../components/Typography.tsx";
import { formatDate } from "../../../utils/date.ts";
import { useGetFullHistory } from "../api/useGetFullHistory.ts";
import style from "./History.module.css";
import { HistoryItem } from "./HistoryItem.tsx";

export const History = () => {
    const { data } = useGetFullHistory();

    const groupedByDate = useMemo(() => {
        const groupedByDate: Record<string, Playback[]> = {};

        data!.playback.forEach((playback) => {
            const playbackDate = formatDate(playback.startTime);

            if (!groupedByDate[playbackDate]) {
                groupedByDate[playbackDate] = [];
            }

            groupedByDate[playbackDate].push(playback);
        });

        return groupedByDate;
    }, [data]);

    return (
        <div className={style.container}>
            {Object.entries(groupedByDate).map(([date, playbacks]) => (
                <div className={style.dayContainer} key={date}>
                    <Typography variant="h1">{date}</Typography>
                    {playbacks.map((playback) => {
                        const content = data!.content.get(playback.contentId)!;

                        return (
                            <Row key={playback.id}>
                                <HistoryItem
                                    application={content.application}
                                    artist={content.artist}
                                    finishTime={playback.finishTime}
                                    id={content.id}
                                    startTime={playback.startTime}
                                    thumbnail={content.thumbnail}
                                    title={content.title}
                                    url={content.url}
                                />
                            </Row>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};
