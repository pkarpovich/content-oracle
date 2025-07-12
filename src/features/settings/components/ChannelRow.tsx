import type { ChangeEvent } from "react";
import { useCallback } from "react";

import type { YoutubeSubscription } from "../../../api/settings.ts";
import { Row } from "../../../components/row/Row.tsx";
import style from "./ChannelRow.module.css";

type Props = {
    channel: YoutubeSubscription;
    disabled: boolean;
    onRankChange: (channelId: string, newRank: number) => void;
    rank: number;
};

export const ChannelRow = ({ channel, disabled, onRankChange, rank }: Props) => {
    const handleRankChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            onRankChange(channel.channelId, parseInt(e.target.value));
        },
        [channel.channelId, onRankChange],
    );

    return (
        <Row>
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
                        <input
                            className={style.slider}
                            disabled={disabled && rank === 0 ? true : false}
                            max="10"
                            min="0"
                            onChange={handleRankChange}
                            type="range"
                            value={rank}
                        />
                        <span className={style.rankLabel}>{rank}</span>
                    </div>
                </div>
            </div>
        </Row>
    );
};
