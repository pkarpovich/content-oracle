import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";

import styles from "./BottomSheet.module.css";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    wide?: boolean;
};

export const BottomSheet = ({ isOpen, onClose, children, wide = false }: Props) => {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    const handleOverlayClick = (event: React.MouseEvent) => {
        if (event.target === overlayRef.current) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div
            ref={overlayRef}
            className={styles.overlay}
            onClick={handleOverlayClick}
        >
            <div className={clsx(styles.sheet, { [styles.wide]: wide })}>
                <div className={styles.handle} />
                <div className={styles.content}>
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};