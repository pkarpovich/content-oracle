import type { ReactNode } from "react";

import style from "./Row.module.css";

type RowProps = {
    children: ReactNode;
};

export const Row = ({ children }: RowProps) => <div className={style.row}>{children}</div>;
