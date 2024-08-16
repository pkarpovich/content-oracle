import clsx from "clsx";
import type { ElementType, ReactNode } from "react";
import { Children } from "react";

type Variant = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "text" | "title";

type Props = {
    as?: ElementType;
    children: ReactNode | ReactNode[];
    className?: string;
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

export const Typography = ({ as, children, className, variant }: Props) => {
    const Tag = as ?? tags[variant];

    return <Tag className={clsx(Boolean(className) && className)}>{Children.map(children, (child) => child)}</Tag>;
};
