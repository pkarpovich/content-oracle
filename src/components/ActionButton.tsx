import type { ReactNode } from "react";

import clsx from "clsx";

import styles from "./ActionButton.module.css";

type Variant = "default" | "primary" | "danger";

type Props = {
    icon: ReactNode;
    title: string;
    description: string;
    onClick: () => void;
    variant?: Variant;
};

export const ActionButton = ({ icon, title, description, onClick, variant = "default" }: Props) => (
    <button className={clsx(styles.button, styles[variant])} onClick={onClick} type="button">
        <div className={styles.iconContainer}>
            {icon}
        </div>
        <div className={styles.textContainer}>
            <div className={styles.title}>{title}</div>
            <div className={styles.description}>{description}</div>
        </div>
    </button>
);