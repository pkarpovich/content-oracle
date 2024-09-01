import { categoryToHash } from "../../../api/content.ts";
import { Typography } from "../../../components/Typography.tsx";
import { useCreateActivity } from "../api/useCreateActivity.ts";
import { useGetAllContent } from "../api/useGetAllContent.ts";
import { useOpenContent } from "../api/useOpenContent.ts";
import style from "./ContentCategoryList.module.css";
import { ContentList } from "./ContentList.tsx";
import { EsportsPills } from "./EsportsPills.tsx";

export const ContentCategoryList = () => {
    const { data, error } = useGetAllContent();
    const { mutate: openContent } = useOpenContent();

    const { mutate: createActivity } = useCreateActivity();

    return (
        <>
            {error ? <p>Error: {error.message}</p> : null}
            <div className={style.container}>
                <EsportsPills matches={data.esportsMatches} />
                {Array.from(data.groupedContent.entries()).map(([category, content]) => (
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
