import { clsx } from "clsx";
import type { ChangeEvent, ReactNode } from "react";
import { useCallback, useState } from "react";

import styles from "./Input.module.css";

type Props = {
    className?: string;
    disabled?: boolean;
    error?: string;
    icon?: ReactNode;
    label?: string;
    name?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    readOnly?: boolean;
    required?: boolean;
    type?: string;
    value: string;
};

export const Input = ({
    className,
    disabled = false,
    error,
    icon,
    label,
    name,
    onChange,
    placeholder,
    readOnly = false,
    required = false,
    type = "text",
    value,
}: Props) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            onChange?.(e.target.value);
        },
        [onChange],
    );

    const handleFocus = useCallback(() => {
        setIsFocused(true);
    }, []);

    const handleBlur = useCallback(() => {
        setIsFocused(false);
    }, []);

    const isFloating = Boolean(value) || Boolean(error) || isFocused;

    return (
        <div className={clsx(styles.inputWrapper, className)}>
            <div
                className={clsx(styles.inputContainer, {
                    [styles.errorBorder]: Boolean(error),
                    [styles.focused]: isFloating,
                })}
            >
                {icon ? <span className={styles.icon}>{icon}</span> : null}
                <input
                    className={styles.input}
                    disabled={disabled}
                    id={name}
                    name={name}
                    onBlur={handleBlur}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    placeholder={isFloating ? placeholder : ""}
                    readOnly={readOnly}
                    required={required}
                    type={type}
                    value={value}
                />
                {label ? (
                    <label
                        className={clsx(styles.label, {
                            [styles.labelFloating]: isFloating,
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
