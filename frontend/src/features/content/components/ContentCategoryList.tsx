import { useMemo } from "react";

import { Category, categoryToHash } from "../../../api/content.ts";
import { Typography } from "../../../components/Typography.tsx";
import { usePopup } from "../../../hooks/usePopup.ts";
import { useCreateActivity } from "../api/useCreateActivity.ts";
import { useGetAllContent } from "../api/useGetAllContent.ts";
import { useOpenContent } from "../api/useOpenContent.ts";
import { ActionButton } from "./ActionButton.tsx";
import { AddToWatchlistPopup } from "./AddToWatchlistPopup.tsx";
import style from "./ContentCategoryList.module.css";
import { ContentList } from "./ContentList.tsx";
import { EsportsPills } from "./EsportsPills.tsx";
import { SendToTvPopupPopup } from "./SendToTvPopup.tsx";

const CustomCategoryOrder = [
    Category.liveStreams,
    Category.youtubeHistory,
    Category.youTubeWatchlist,
    Category.youTubeSuggestions,
    Category.unsubscribedChannels,
];

export const ContentCategoryList = () => {
    const { close: closeWatchlistPopup, isOpen: isWatchlistPopupOpen, open: openWatchlistPopup } = usePopup();
    const { close: closeSendToTvPopup, isOpen: isSendToTvPopupOpen, open: openSendToTvPopup } = usePopup();
    const { data, error } = useGetAllContent();
    const { mutate: openContent } = useOpenContent();

    const { mutate: createActivity } = useCreateActivity();

    const sortedEntries = useMemo(
        () =>
            Array.from(data.groupedContent.entries()).sort(([categoryA], [categoryB]) => {
                const indexA = CustomCategoryOrder.indexOf(categoryA);
                const indexB = CustomCategoryOrder.indexOf(categoryB);

                if (indexA === -1) {
                    return 1;
                }
                if (indexB === -1) {
                    return -1;
                }

                return indexA - indexB;
            }),
        [data.groupedContent],
    );

    return (
        <>
            <ActionButton onAddToWatchlist={openWatchlistPopup} onSendToTv={openSendToTvPopup} />
            <AddToWatchlistPopup isOpen={isWatchlistPopupOpen} onClose={closeWatchlistPopup} />
            <SendToTvPopupPopup isOpen={isSendToTvPopupOpen} onClose={closeSendToTvPopup} />
            {error ? <p>Error: {error.message}</p> : null}
            <div className={style.container}>
                <EsportsPills matches={data.esportsMatches} />
                {sortedEntries.map(([category, content]) => (
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
