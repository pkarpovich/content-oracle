import type { ReactNode } from "react";

import styles from "./ActionButton.module.css";

type Props = {
    icon: ReactNode;
    title: string;
    description: string;
    onClick: () => void;
};

export const ActionButton = ({ icon, title, description, onClick }: Props) => (
    <button className={styles.button} onClick={onClick} type="button">
        <div className={styles.iconContainer}>
            {icon}
        </div>
        <div className={styles.textContainer}>
            <div className={styles.title}>{title}</div>
            <div className={styles.description}>{description}</div>
        </div>
    </button>
);