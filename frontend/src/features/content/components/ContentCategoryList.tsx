import { Fragment, useCallback, useState } from "react";

import { Typography } from "../../../components/Typography.tsx";
import { generateId } from "../../../utils/generateId.ts";
import { useCreateActivity } from "../api/useCreateActivity.ts";
import { useGetAllContent } from "../api/useGetAllContent.ts";
import { useOpenContent } from "../api/useOpenContent.ts";
import { ContentList } from "./ContentList.tsx";

export const ContentCategoryList = () => {
    const [refetchKey, setRefetchKey] = useState<string>("");

    const { data: groupedContent, error } = useGetAllContent(refetchKey);
    const { mutate: openContent } = useOpenContent();

    const handleSuccessActivityCreation = useCallback(() => {
        setRefetchKey(generateId());
    }, []);

    const { mutate: createActivity } = useCreateActivity(handleSuccessActivityCreation);

    return (
        <>
            {error ? <p>Error: {error.message}</p> : null}
            {Array.from(groupedContent.entries()).map(([category, content]) => (
                <Fragment key={category}>
                    <Typography variant="h2">{category}</Typography>
                    <ContentList
                        category={category}
                        content={content}
                        key={category}
                        onCheck={createActivity}
                        onOpenUrl={openContent}
                    />
                </Fragment>
            ))}
        </>
    );
};
