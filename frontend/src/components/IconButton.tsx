import type { ReactNode } from "react";

import style from "./IconButton.module.css";

type Props = {
    children: ReactNode;
    onClick: () => void;
    tooltip?: string;
    label?: string;
};

export const IconButton = ({ children, onClick, tooltip, label }: Props) => (
    <button className={style.button} onClick={onClick} type="button" title={tooltip}>
        {children}
        {label && <span className={style.label}>{label}</span>}
        {tooltip && <span className={style.tooltip}>{tooltip}</span>}
    </button>
);
