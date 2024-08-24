import type { ReactNode } from "react";
import { useMemo } from "react";

import { Applications } from "../../../api/history.ts";
import KinopubIcon from "../../../icons/kinopub.svg";
import NetflixIcon from "../../../icons/netflix.svg";
import PlexIcon from "../../../icons/plex.svg";
import PodcastIcon from "../../../icons/podcast.svg";
import TwitchIcon from "../../../icons/twitch.svg";
import UnknownIcon from "../../../icons/unknown.svg";
import ViaplayIcon from "../../../icons/viaplay.svg";
import YoutubeIcon from "../../../icons/youtube.svg";
import style from "./HistoryItem.module.css";

type HistoryItemProps = {
    application: string;
    artist: string;
    finishTime: string;
    id: string;
    startTime: string;
    thumbnail?: string;
    title: string;
    url?: string;
};

export const HistoryItem = ({
    application,
    artist,
    finishTime,
    startTime,
    thumbnail,
    title,
    url,
}: HistoryItemProps) => {
    const Thumbnail = useMemo<ReactNode>(() => {
        const applicationIcons: Record<string, ReactNode> = {
            [Applications.Infuse]: <PlexIcon />,
            [Applications.Kinopub]: <KinopubIcon />,
            [Applications.Netflix]: <NetflixIcon />,
            [Applications.Podcasts]: <PodcastIcon />,
            [Applications.Twitch]: <TwitchIcon />,
            [Applications.Viaplay]: <ViaplayIcon />,
        };

        if (thumbnail) {
            return <img alt="thumbnail" src={thumbnail} />;
        }

        if (application === Applications.Youtube && !thumbnail) {
            return <YoutubeIcon />;
        }

        if (applicationIcons[application]) {
            return applicationIcons[application];
        }

        return <UnknownIcon />;
    }, [application, thumbnail]);

    const Title = useMemo<ReactNode>(() => {
        if (url) {
            return (
                <a className={style.title} href={url}>
                    {title}
                </a>
            );
        }

        return <div className={style.title}>{title}</div>;
    }, [title, url]);
    return (
        <div className={style.container}>
            <div className={style.thumbnail}>{Thumbnail}</div>
            <div className={style.information}>
                <div className={style.text}>
                    {new Date(startTime).toLocaleTimeString()} - {new Date(finishTime).toLocaleTimeString()}
                </div>
                {Title}
                <div className={style.text}>{artist}</div>
                <div className={style.text}>{application}</div>
            </div>
        </div>
    );
};
