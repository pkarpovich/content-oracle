import type { MouseEvent, ReactNode } from "react";
import { useCallback, useEffect } from "react";

import CloseIcon from "../icons/close.svg";
import styles from "./Popup.module.css";

type Props = {
    children: ReactNode;
    isOpen: boolean;
    onClose: () => void;
    title?: string;
};

export const Popup = ({ children, isOpen, onClose, title }: Props) => {
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        },
        [onClose],
    );

    const handlePreventPropagation = useCallback((e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [handleKeyDown, isOpen]);

    if (!isOpen) {
        return null;
    }

    return (
        <button className={styles.overlay} onClick={onClose} type="button">
            <button className={styles.popup} onClick={handlePreventPropagation} type="button">
                <div className={styles.header}>
                    {title ? <div className={styles.title}>{title}</div> : null}
                    <button className={styles.closeButton} onClick={onClose} type="button">
                        <CloseIcon />
                    </button>
                </div>
                <div className={styles.content}>{children}</div>
            </button>
        </button>
    );
};
