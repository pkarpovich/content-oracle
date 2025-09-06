import { BottomSheet } from "../../../components/BottomSheet.tsx";
import { Typography } from "../../../components/Typography.tsx";
import { formatDate } from "../../../utils/date.ts";
import { GroupedHistoryItem } from "../../../api/history.ts";
import styles from "./HistoryItemDetails.module.css";

type HistoryItemDetailsProps = {
    onClose: () => void;
    item: GroupedHistoryItem;
};

export const HistoryItemDetails = ({ onClose, item }: HistoryItemDetailsProps) => {

    const startDate = new Date(item.mostRecentPlayback.startTime);
    const finishDate = new Date(item.mostRecentPlayback.finishTime);
    const duration = Math.round((finishDate.getTime() - startDate.getTime()) / 1000 / 60); // duration in minutes

    return (
        <BottomSheet isOpen={true} onClose={onClose} wide>
            <div className={styles.container}>
                <div className={styles.leftColumn}>
                    <div className={styles.header}>
                        {item.content.thumbnail && (
                            <div className={styles.thumbnailContainer}>
                                <img alt={item.content.title} className={styles.thumbnail} src={item.content.thumbnail} />
                            </div>
                        )}
                        <div className={styles.titleSection}>
                            <Typography variant="h2" className={styles.title}>
                                {item.content.title}
                            </Typography>
                            <Typography variant="text" className={styles.artist}>
                                {item.content.artist}
                            </Typography>
                            <Typography variant="text" className={styles.application}>
                                {item.content.application}
                            </Typography>
                        </div>
                    </div>

                    <div className={styles.details}>
                        <div className={styles.detailRow}>
                            <Typography variant="text" className={styles.label}>Start Time:</Typography>
                            <Typography variant="text" className={styles.value}>
                                {formatDate(item.mostRecentPlayback.startTime)} at {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                        </div>

                        <div className={styles.detailRow}>
                            <Typography variant="text" className={styles.label}>Finish Time:</Typography>
                            <Typography variant="text" className={styles.value}>
                                {formatDate(item.mostRecentPlayback.finishTime)} at {finishDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                        </div>

                        <div className={styles.detailRow}>
                            <Typography variant="text" className={styles.label}>Duration:</Typography>
                            <Typography variant="text" className={styles.value}>
                                {duration} minutes
                            </Typography>
                        </div>

                        <div className={styles.detailRow}>
                            <Typography variant="text" className={styles.label}>Session ID:</Typography>
                            <Typography variant="text" className={styles.value}>
                                {item.content.id}
                            </Typography>
                        </div>

                        {item.content.url && (
                            <div className={styles.detailRow}>
                                <Typography variant="text" className={styles.label}>URL:</Typography>
                                <Typography variant="text" className={styles.value}>
                                    <a href={item.content.url} target="_blank" rel="noopener noreferrer" className={styles.link}>
                                        {item.content.url}
                                    </a>
                                </Typography>
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.rightColumn}>
                    <Typography variant="h3" className={styles.sectionTitle}>
                        All Sessions ({item.allPlaybacks?.length || 0})
                    </Typography>
                    <div className={styles.sessionsList}>
                        {item.allPlaybacks?.map((session, index) => {
                            const sessionStart = new Date(session.startTime);
                            const sessionFinish = new Date(session.finishTime);
                            const sessionDuration = Math.round((sessionFinish.getTime() - sessionStart.getTime()) / 1000 / 60);
                            
                            return (
                                <div key={`${session.contentId}-${session.startTime}`} className={styles.sessionItem}>
                                    <div className={styles.sessionHeader}>
                                        <Typography variant="text" className={styles.sessionNumber}>
                                            Session {index + 1}
                                        </Typography>
                                        <Typography variant="text" className={styles.sessionDuration}>
                                            {sessionDuration} min
                                        </Typography>
                                    </div>
                                    <div className={styles.sessionTime}>
                                        <Typography variant="text" className={styles.sessionTimeText}>
                                            {formatDate(session.startTime)} at {sessionStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {sessionFinish.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Typography>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </BottomSheet>
    );
};