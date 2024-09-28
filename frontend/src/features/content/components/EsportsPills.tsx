import { clsx } from "clsx";
import { useCallback } from "react";

import type { Match } from "../../../api/content.ts";
import { GameType } from "../../../api/content.ts";
import CsIcon from "../../../icons/cs2.svg?url";
import DotaIcon from "../../../icons/dota2.svg?url";
import { formatDate } from "../../../utils/date.ts";
import styles from "./EsportsPills.module.css";

const MatchDateFormat = "dd MMM, h:mm a";

const ZeroScore = "(0-0)";

type Props = {
    matches: Match[];
};

export const EsportsPills = ({ matches }: Props) => {
    const handleClick = useCallback(
        (url: string) => () => {
            window.open(url, "_blank");
        },
        [],
    );

    return (
        <div className={styles.container}>
            <div className={styles.pillsContainer}>
                {matches.map((match) => {
                    const FallbackIcon = match.gameType === GameType.cs2 ? CsIcon : DotaIcon;
                    const team1Score = parseScore(match.score)[0];
                    const team2Score = parseScore(match.score)[1];
                    return (
                        <button
                            className={clsx(styles.pill, {
                                [styles.cs2]: match.gameType === GameType.cs2,
                                [styles.dota2]: match.gameType === GameType.dota2,
                                [styles.future]: match.score === ZeroScore,
                                [styles.live]: match.isLive,
                            })}
                            key={match.id}
                            onClick={handleClick(match.url)}
                            type="button"
                        >
                            <div className={styles.logoContainer}>
                                <img
                                    alt={match.team1.name}
                                    className={styles.teamLogo}
                                    src={match.team1.logo || FallbackIcon}
                                    title={match.team1.name}
                                />
                            </div>
                            <span
                                className={clsx(styles.score, {
                                    [styles.loser]: team1Score < team2Score,
                                    [styles.winner]: team1Score > team2Score,
                                })}
                            >
                                {team1Score}
                            </span>
                            <span className={styles.scoreDivider}>vs</span>
                            <span
                                className={clsx(styles.score, {
                                    [styles.loser]: team2Score < team1Score,
                                    [styles.winner]: team2Score > team1Score,
                                })}
                            >
                                {team2Score}
                            </span>
                            <div className={styles.logoContainer}>
                                <img
                                    alt={match.team2.name}
                                    className={styles.teamLogo}
                                    src={match.team2.logo || FallbackIcon}
                                    title={match.team2.name}
                                />
                            </div>
                            <div className={styles.date}>{formatDate(match.time, MatchDateFormat)}</div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const parseScore = (score: string): [number, number] => {
    const [team1, team2] = score.replaceAll("(", "").replaceAll(")", "").split("-");
    return [parseInt(team1), parseInt(team2)];
};
