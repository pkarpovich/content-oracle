import { useCallback, useState } from "react";

import { categoryToHash } from "../../../api/content.ts";
import { Typography } from "../../../components/Typography.tsx";
import { generateId } from "../../../utils/generateId.ts";
import { useCreateActivity } from "../api/useCreateActivity.ts";
import { useGetAllContent } from "../api/useGetAllContent.ts";
import { useOpenContent } from "../api/useOpenContent.ts";
import style from "./ContentCategoryList.module.css";
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
            <div className={style.container}>
                {Array.from(groupedContent.entries()).map(([category, content]) => (
                    <div className={style.itemContainer} id={categoryToHash(category)} key={category}>
                        <Typography className={style.categoryTitle} variant="h2">
                            {category}
                        </Typography>
                        <ContentList
                            category={category}
                            content={content}
                            key={category}
                            onCheck={createActivity}
                            onOpenUrl={openContent}
                        />
                    </div>
                ))}
            </div>
        </>
    );
};
