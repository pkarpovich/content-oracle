import { clsx } from "clsx";
import type { ReactNode } from "react";

import styles from "./Button.module.css";

type Props = {
    children: ReactNode;
    className?: string;
    color?: "default" | "primary" | "secondary";
    disabled?: boolean;
    endIcon?: ReactNode;
    loading?: boolean;
    onClick?: () => void;
    size?: "large" | "medium" | "small";
    startIcon?: ReactNode;
    type?: "button" | "reset" | "submit";
    variant?: "contained" | "outlined" | "text";
};

export const Button = ({
    children,
    className,
    color = "primary",
    disabled = false,
    endIcon,
    loading = false,
    onClick,
    size = "medium",
    startIcon,
    type = "button",
    variant = "contained",
}: Props) => (
    <button
        className={clsx(
            styles.button,
            styles[variant],
            styles[size],
            styles[color],
            {
                [styles.disabled]: disabled || loading,
                [styles.loading]: loading,
            },
            className
        )}
        disabled={disabled || loading}
        onClick={onClick}
        type={type}
    >
        <span className={styles.content}>
            {loading && <span className={styles.loader} />}
            {startIcon && !loading ? <span className={styles.startIcon}>{startIcon}</span> : null}
            <span className={clsx(styles.label, { [styles.labelHidden]: loading })}>{children}</span>
            {endIcon && !loading ? <span className={styles.endIcon}>{endIcon}</span> : null}
        </span>
    </button>
);
