import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";

import type { BlockedChannel } from "../../../api/settings.ts";
import { Typography } from "../../../components/Typography.tsx";
import { useMediaQuery } from "../../../hooks/useMediaQuery.ts";
import { BlockedChannelRow } from "./BlockedChannelRow.tsx";
import style from "./BlockedChannels.module.css";

type Props = {
    blockedChannels: BlockedChannel[];
    onUnblock: (channelId: string) => void;
};

export const BlockedChannels = ({ blockedChannels, onUnblock }: Props) => {
    const parentRef = useRef<HTMLDivElement>(null);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const rowVirtualizer = useVirtualizer({
        count: blockedChannels.length,
        estimateSize: () => (isDesktop ? 120 : 160),
        gap: 20,
        getScrollElement: () => parentRef.current,
    });

    if (blockedChannels.length === 0) {
        return (
            <div className={style.container}>
                <div className={style.header}>
                    <Typography variant="h2">Blocked Channels</Typography>
                    <Typography variant="text">Manage channels that you've blocked from appearing in your content feed.</Typography>
                </div>
                <div className={style.emptyState}>
                    <Typography variant="h3">No blocked channels</Typography>
                    <Typography variant="text">You haven't blocked any channels yet. Blocked channels will appear here for easy management.</Typography>
                </div>
            </div>
        );
    }

    return (
        <div className={style.container}>
            <div className={style.header}>
                <Typography variant="h2">Blocked Channels</Typography>
                <Typography variant="text">Manage channels that you've blocked. You can unblock them to see their content again.</Typography>
            </div>
            <div className={style.blockedChannelsContainer} ref={parentRef}>
                <div
                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        position: "relative",
                        width: "100%",
                    }}
                >
                    {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                        const channel = blockedChannels[virtualItem.index];
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
                                <BlockedChannelRow
                                    channel={channel}
                                    key={channel.channelId}
                                    onUnblock={onUnblock}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};