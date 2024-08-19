import type { ReactNode } from "react";

import style from "./Button.module.css";

type Props = {
    children: ReactNode;
    onClick: () => void;
};

export const Button = ({ children, onClick }: Props) => (
    <button className={style.button} onClick={onClick} type="button">
        {children}
    </button>
);
