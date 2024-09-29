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
        className={clsx(styles.button, styles[variant], styles[size], styles[color], {
            [styles.disabled]: disabled || loading,
        })}
        disabled={disabled || loading}
        onClick={onClick}
        type={type}
    >
        {loading ? (
            <span className={styles.loader} />
        ) : (
            <>
                {startIcon ? <span className={styles.icon}>{startIcon}</span> : null}
                <span className={styles.label}>{children}</span>
                {endIcon ? <span className={styles.icon}>{endIcon}</span> : null}
            </>
        )}
    </button>
);
