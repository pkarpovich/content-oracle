import { Fragment } from "react";

import { Typography } from "../../../components/Typography.tsx";
import { useGetAllContent } from "../api/useGetAllContent.ts";
import { useOpenContent } from "../api/useOpenContent.ts";
import { ContentList } from "./ContentList.tsx";

export const ContentCategoryList = () => {
    const { data: groupedContent, error } = useGetAllContent();
    const { mutate: openContent } = useOpenContent();

    return (
        <>
            {error ? <p>Error: {error.message}</p> : null}
            {Array.from(groupedContent.entries()).map(([category, content]) => (
                <Fragment key={category}>
                    <Typography variant="h2">{category}</Typography>
                    <ContentList content={content} key={category} onOpenUrl={openContent} />
                </Fragment>
            ))}
        </>
    );
};
