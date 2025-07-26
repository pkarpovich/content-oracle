import {useCallback, useMemo, useState} from "react";
import { Link } from "@tanstack/react-router";

import { Category, categoryToHash } from "../../../api/content.ts";
import { Typography } from "../../../components/Typography.tsx";
import { usePopup } from "../../../hooks/usePopup.ts";
import { useContentTriageModal } from "../../../contexts/ContentTriageModalContext.tsx";
import { useGetAllContent } from "../api/useGetAllContent.ts";
import { useOpenContent } from "../api/useOpenContent.ts";
import { ActionButton } from "./ActionButton.tsx";
import { AddToWatchlistPopup } from "./AddToWatchlistPopup.tsx";
import style from "./ContentCategoryList.module.css";
import { ContentList } from "./ContentList.tsx";
import { SendToTvPopupPopup } from "./SendToTvPopup.tsx";

const CustomCategoryOrder = [
    Category.liveStreams,
    Category.continueWatching,
    Category.watchLater,
    Category.youTubeSuggestions,
    Category.unsubscribedChannels,
];

export const ContentCategoryList = () => {
    const { close: closeWatchlistPopup, isOpen: isWatchlistPopupOpen, open: openWatchlistPopup } = usePopup();
    const { close: closeSendToTvPopup, isOpen: isSendToTvPopupOpen, open: openSendToTvPopup } = usePopup();
    const { openTriageModal } = useContentTriageModal();
    const { data, error } = useGetAllContent();
    const { mutate: openContent } = useOpenContent();
    
    const [collapsedCategories, setCollapsedCategories] = useState<Set<Category>>(() => {
        try {
            const stored = localStorage.getItem('contentCategoriesCollapsed');
            if (stored) {
                const parsedArray = JSON.parse(stored) as Category[];
                return new Set(parsedArray);
            }
        } catch (error) {
            console.warn('Failed to load collapsed categories from localStorage:', error);
        }
        return new Set();
    });


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


    const toggleCategoryCollapse = useCallback((category: Category) => {
        setCollapsedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(category)) {
                newSet.delete(category);
            } else {
                newSet.add(category);
            }
            
            try {
                localStorage.setItem('contentCategoriesCollapsed', JSON.stringify(Array.from(newSet)));
            } catch (error) {
                console.warn('Failed to save collapsed categories to localStorage:', error);
            }
            
            return newSet;
        });
    }, []);

    const isCategoryCollapsed = useCallback((category: Category) => {
        return collapsedCategories.has(category);
    }, [collapsedCategories]);

    return (
        <>
            <ActionButton onAddToWatchlist={openWatchlistPopup} onSendToTv={openSendToTvPopup} onTriage={openTriageModal} />
            <AddToWatchlistPopup isOpen={isWatchlistPopupOpen} onClose={closeWatchlistPopup} />
            <SendToTvPopupPopup isOpen={isSendToTvPopupOpen} onClose={closeSendToTvPopup} />
            {error ? <p>Error: {error.message}</p> : null}
            <div className={style.container}>
                {sortedEntries.map(([category, content]) => (
                    <div className={style.itemContainer} id={categoryToHash(category)} key={category}>
                        <div className={style.categoryHeader}>
                            <Link
                                className={style.categoryLink}
                                to="/category/$categoryName"
                                params={{ categoryName: categoryToHash(category) }}
                            >
                                <Typography className={style.categoryTitle} variant="h2">
                                    {category}
                                </Typography>
                            </Link>
                            <span className={style.categoryCount}>
                                {data.meta[category]?.total || content.length}
                            </span>
                            <button 
                                className={style.collapseButton}
                                onClick={() => toggleCategoryCollapse(category)}
                                type="button"
                            >
                                <div className={`${style.collapseIcon} ${isCategoryCollapsed(category) ? style.collapsed : ''}`}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </button>
                        </div>
                        {!isCategoryCollapsed(category) && (
                            <ContentList
                                category={category}
                                content={content}
                                key={category}
                                meta={data.meta[category]}
                                onOpenUrl={openContent}
                            />
                        )}
                    </div>
                ))}
            </div>
        </>
    );
};
