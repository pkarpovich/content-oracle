import clsx from "clsx";
import type { ElementType, ReactNode } from "react";
import { Children } from "react";

import style from "./Typography.module.css";

type Variant = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "text" | "title";

type Props = {
    as?: ElementType;
    children: ReactNode | ReactNode[];
    className?: string;
    id?: string;
    title?: string;
    variant: Variant;
};

const tags: Record<Variant, ElementType> = {
    h1: "h1",
    h2: "h2",
    h3: "h3",
    h4: "h4",
    h5: "h5",
    h6: "h6",
    text: "p",
    title: "h1",
};

export const Typography = ({ as, children, className, id, title, variant }: Props) => {
    const Tag = as ?? tags[variant];

    return (
        <Tag className={clsx(style.typography, Boolean(className) && className)} id={id} title={title}>
            {Children.map(children, (child) => child)}
        </Tag>
    );
};
