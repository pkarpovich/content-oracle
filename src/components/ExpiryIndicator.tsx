import { Typography } from "./Typography.tsx";
import styles from "./ContentTriageModal.module.css";

type ExpiryIndicatorProps = {
    publishedAt: string;
};

export const ExpiryIndicator = ({ publishedAt }: ExpiryIndicatorProps) => {
    const publishedDate = new Date(publishedAt);
    const now = new Date();
    const daysSincePublished = Math.floor(
        (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const daysUntilExpiry = 7 - daysSincePublished;

    if (daysUntilExpiry > 0 && daysUntilExpiry <= 7) {
        return (
            <div className={styles.expiryIndicator}>
                <div className={styles.expiryDot} />
                <Typography variant="text">
                    Auto-dismisses in {daysUntilExpiry} {daysUntilExpiry === 1 ? "day" : "days"}
                </Typography>
            </div>
        );
    }

    if (daysUntilExpiry === 0) {
        return (
            <div className={styles.expiryIndicator}>
                <div className={styles.expiryDot} data-urgent="true" />
                <Typography variant="text">Auto-dismisses today</Typography>
            </div>
        );
    }

    return null;
};