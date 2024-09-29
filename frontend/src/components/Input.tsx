import { clsx } from "clsx";
import type { ChangeEvent, ReactNode } from "react";
import { useCallback } from "react";

import styles from "./Input.module.css";

type Props = {
    className?: string;
    disabled?: boolean;
    error?: string;
    icon?: ReactNode;
    label?: string;
    name?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    type?: string;
    value: string;
};

export const Input = ({
    disabled = false,
    error,
    icon,
    label,
    name,
    onChange,
    required = false,
    type = "text",
    value,
}: Props) => {
    const handleChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            onChange(e.target.value);
        },
        [onChange],
    );

    return (
        <div className={styles.inputWrapper}>
            <div
                className={clsx(styles.inputContainer, {
                    [styles.errorBorder]: Boolean(error),
                })}
            >
                {icon ? <span className={styles.icon}>{icon}</span> : null}
                <input
                    className={styles.input}
                    disabled={disabled}
                    id={name}
                    name={name}
                    onChange={handleChange}
                    required={required}
                    type={type}
                    value={value}
                />
                {label ? (
                    <label
                        className={clsx(styles.label, {
                            [styles.labelFloating]: Boolean(value) || Boolean(error),
                        })}
                        htmlFor={name}
                    >
                        {label} {required ? <span className={styles.required}>*</span> : null}
                    </label>
                ) : null}
            </div>
            {error ? <div className={styles.errorText}>{error}</div> : null}
        </div>
    );
};
