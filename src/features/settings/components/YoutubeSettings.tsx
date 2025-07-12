import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo, useRef } from "react";

import type { YoutubeSubscription } from "../../../api/settings.ts";
import { Typography } from "../../../components/Typography.tsx";
import { useMediaQuery } from "../../../hooks/useMediaQuery.ts";
import { ChannelRow } from "./ChannelRow.tsx";
import style from "./YoutubeSettings.module.css";

type Props = {
    onRankChange: (channelId: string, newRank: number) => void;
    ranking: Map<string, number>;
    subscriptions: YoutubeSubscription[];
};

const TotalRanksAmount = 150;

export const YoutubeSettings = ({ onRankChange, ranking, subscriptions }: Props) => {
    const parentRef = useRef<HTMLDivElement>(null);

    const isDesktop = useMediaQuery("(min-width: 768px)");

    const rowVirtualizer = useVirtualizer({
        count: subscriptions.length,
        estimateSize: () => (isDesktop ? 120 : 160),
        gap: 20,
        getScrollElement: () => parentRef.current,
    });

    const remainingRanks = useMemo(
        () => TotalRanksAmount - Array.from(ranking.values()).reduce((acc, rank) => acc + rank, 0),
        [ranking],
    );

    const isDisabled = useMemo(() => remainingRanks <= 0, [remainingRanks]);

    return (
        <div className={style.container}>
            <Typography variant="h2">Youtube Subscriptions Ranking</Typography>
            <div className={style.pointsContainer}>
                <Typography variant="h3">Total points: {TotalRanksAmount}</Typography>
                <Typography variant="h3">Remaining points: {remainingRanks}</Typography>
            </div>
            <div className={style.subscriptionsContainer} ref={parentRef}>
                <div
                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        position: "relative",
                        width: "100%",
                    }}
                >
                    {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                        const sub = subscriptions[virtualItem.index];
                        return (
                            <div
                                key={virtualItem.key}
                                style={{
                                    height: `${virtualItem.size}px`,
                                    left: 0,
                                    position: "absolute",
                                    top: 0,
                                    transform: `translateY(${virtualItem.start}px)`,
                                    width: "100%",
                                }}
                            >
                                <ChannelRow
                                    channel={sub}
                                    disabled={isDisabled}
                                    key={sub.channelId}
                                    onRankChange={onRankChange}
                                    rank={ranking.get(sub.channelId) ?? 0}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
