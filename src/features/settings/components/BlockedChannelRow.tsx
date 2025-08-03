import { useCallback } from "react";

import type { BlockedChannel } from "../../../api/settings.ts";
import { Button } from "../../../components/Button.tsx";
import style from "./BlockedChannelRow.module.css";

type Props = {
    channel: BlockedChannel;
    onUnblock: (channelId: string) => void;
};

export const BlockedChannelRow = ({ channel, onUnblock }: Props) => {
    const handleUnblock = useCallback(() => {
        onUnblock(channel.channelId);
    }, [channel.channelId, onUnblock]);

    return (
        <div className={style.container}>
            <img alt={channel.name} className={style.thumbnail} src={channel.previewUrl} />
            <div className={style.infoContainer}>
                <div className={style.channelInfo}>
                    <div className={style.channelName}>{channel.name}</div>
                    <a className={style.channelUrl} href={channel.url} rel="noopener noreferrer" target="_blank">
                        {channel.url}
                    </a>
                </div>
                <div className={style.controls}>
                    <Button 
                        onClick={handleUnblock}
                        variant="outlined"
                        color="secondary"
                        size="small"
                    >
                        Unblock Channel
                    </Button>
                </div>
            </div>
        </div>
    );
};