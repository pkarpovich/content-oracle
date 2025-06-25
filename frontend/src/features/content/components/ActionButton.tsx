import { clsx } from "clsx";
import { useCallback, useState } from "react";

import AddIcon from "../../../icons/add.svg";
import AddBookmarkIcon from "../../../icons/add-bookmark.svg";
import AppleTvIcon from "../../../icons/apple-tv.svg";
import CheckIcon from "../../../icons/check.svg";
import styles from "./ActionButton.module.css";

type Props = {
    onAddToWatchlist: () => void;
    onSendToTv: () => void;
    onTriage: () => void;
};

export const ActionButton = ({ onAddToWatchlist, onSendToTv, onTriage }: Props) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleButtonClick = useCallback(() => {
        setIsOpen((prevIsOpen) => !prevIsOpen);
    }, []);

    const handleSubIconClick = useCallback(
        (handler: () => void) => () => {
            setIsOpen(false);
            handler();
        },
        [],
    );

    return (
        <div
            className={clsx(styles.container, {
                [styles.open]: isOpen,
            })}
        >
            <div className={styles.buttonsContainer}>
                <div className={styles.buttonWrapper}>
                    <span className={styles.buttonLabel}>Content Triage</span>
                    <button
                        className={clsx(styles.button, styles.childButton)}
                        onClick={handleSubIconClick(onTriage)}
                        type="button"
                    >
                        <CheckIcon />
                    </button>
                </div>
                <div className={styles.buttonWrapper}>
                    <span className={styles.buttonLabel}>Add to Watchlist</span>
                    <button
                        className={clsx(styles.button, styles.childButton)}
                        onClick={handleSubIconClick(onAddToWatchlist)}
                        type="button"
                    >
                        <AddBookmarkIcon />
                    </button>
                </div>
                <div className={styles.buttonWrapper}>
                    <span className={styles.buttonLabel}>Send to TV</span>
                    <button
                        className={clsx(styles.button, styles.childButton)}
                        onClick={handleSubIconClick(onSendToTv)}
                        type="button"
                    >
                        <AppleTvIcon />
                    </button>
                </div>
            </div>
            <div className={styles.mainButtonContainer}>
                <button className={styles.button} onClick={handleButtonClick} type="button">
                    <AddIcon />
                </button>
            </div>
        </div>
    );
};
