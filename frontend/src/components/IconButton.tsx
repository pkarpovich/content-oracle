import type { ReactNode } from "react";

import style from "./IconButton.module.css";

type Props = {
    children: ReactNode;
    onClick: () => void;
};

export const IconButton = ({ children, onClick }: Props) => (
    <button className={style.button} onClick={onClick} type="button">
        {children}
    </button>
);
