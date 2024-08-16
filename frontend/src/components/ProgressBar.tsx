import { clsx } from "clsx";

import style from "./ProgressBar.module.css";

type Props = {
    isLive?: boolean;
    progress: number;
    total?: number;
};

export const ProgressBar = ({ isLive, progress, total = 100 }: Props) => {
    const percentage = (progress / total) * 100;

    return (
        <div className={style.progressBar}>
            <div
                className={clsx({
                    [style.progressBarFill]: !isLive,
                    [style.progressBarFillLive]: isLive,
                })}
                style={{ width: isLive ? "100%" : `${percentage}%` }}
            />
        </div>
    );
};
