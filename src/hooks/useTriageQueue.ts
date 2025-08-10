import { useCallback, useEffect, useMemo, useReducer } from "react";

import { type Content, VideoStatus } from "../api/content";

enum ActionType {
    PROCESS_SINGLE_ITEM = "PROCESS_SINGLE_ITEM",
    SKIP_ALL_FROM_CHANNEL = "SKIP_ALL_FROM_CHANNEL",
    BLOCK_CHANNEL = "BLOCK_CHANNEL",
    RESET_QUEUE = "RESET_QUEUE",
    SET_CURRENT_INDEX = "SET_CURRENT_INDEX",
    GO_TO_NEXT = "GO_TO_NEXT",
    GO_TO_PREVIOUS = "GO_TO_PREVIOUS",
    SET_SORTED_ITEMS = "SET_SORTED_ITEMS",
}

type QueueAction =
    | { type: ActionType.PROCESS_SINGLE_ITEM; itemId: string; status: VideoStatus }
    | { type: ActionType.SKIP_ALL_FROM_CHANNEL; channelId: string; videoIds: string[] }
    | { type: ActionType.BLOCK_CHANNEL; channelId: string; videoIds: string[] }
    | { type: ActionType.RESET_QUEUE }
    | { type: ActionType.SET_CURRENT_INDEX; index: number }
    | { type: ActionType.GO_TO_NEXT }
    | { type: ActionType.GO_TO_PREVIOUS }
    | { type: ActionType.SET_SORTED_ITEMS; items: Content[] };

type ProcessedItem = {
    itemId: string;
    status: VideoStatus;
    timestamp: number;
};

type QueueState = {
    processedItems: Map<string, ProcessedItem>;
    skippedChannels: Set<string>;
    blockedChannels: Set<string>;
    currentIndex: number;
    sortedItems: Content[];
};

const initialState: QueueState = {
    processedItems: new Map(),
    skippedChannels: new Set(),
    blockedChannels: new Set(),
    currentIndex: 0,
    sortedItems: [],
};

function addProcessedItems(
    currentItems: Map<string, ProcessedItem>,
    itemIds: string[],
    status: VideoStatus,
    timestamp: number = Date.now(),
): Map<string, ProcessedItem> {
    const newProcessedItems = new Map(currentItems);

    itemIds.forEach((itemId) => {
        newProcessedItems.set(itemId, {
            itemId,
            status,
            timestamp,
        });
    });

    return newProcessedItems;
}

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function sortContentItems(items: Content[], sortBy: SortOption): Content[] {
    switch (sortBy) {
        case SortOption.NEWEST_FIRST:
            return [...items].sort((a, b) => {
                if (!a.publishedAt && !b.publishedAt) return 0;
                if (!a.publishedAt) return 1;
                if (!b.publishedAt) return -1;
                return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
            });

        case SortOption.OLDEST_FIRST:
            return [...items].sort((a, b) => {
                if (!a.publishedAt && !b.publishedAt) return 0;
                if (!a.publishedAt) return 1;
                if (!b.publishedAt) return -1;
                return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
            });

        case SortOption.CHANNEL_NAME:
            return [...items].sort((a, b) => a.artist.name.localeCompare(b.artist.name));

        case SortOption.DEFAULT:
        default:
            return shuffleArray(items);
    }
}

export const findBestPositionAfterChannelRemoval = (
    queue: Content[],
    currentIndex: number,
    channelToRemove: string,
): number => {
    const futureQueue = queue.filter((item) => item.artist.id !== channelToRemove);

    if (futureQueue.length === 0) return 0;

    const currentItem = queue[currentIndex];
    if (currentItem?.artist.id === channelToRemove) {
        for (let i = currentIndex + 1; i < queue.length; i++) {
            const item = queue[i];
            if (item.artist.id !== channelToRemove) {
                return futureQueue.findIndex((futureItem) => futureItem.id === item.id);
            }
        }

        for (let i = currentIndex - 1; i >= 0; i--) {
            const item = queue[i];
            if (item.artist.id !== channelToRemove) {
                return futureQueue.findIndex((futureItem) => futureItem.id === item.id);
            }
        }

        return 0;
    } else {
        const currentItemId = currentItem.id;
        const newPosition = futureQueue.findIndex((item) => item.id === currentItemId);
        return Math.max(0, newPosition);
    }
};

function queueReducer(state: QueueState, action: QueueAction): QueueState {
    switch (action.type) {
        case ActionType.PROCESS_SINGLE_ITEM: {
            return {
                ...state,
                processedItems: addProcessedItems(state.processedItems, [action.itemId], action.status),
            };
        }

        case ActionType.SKIP_ALL_FROM_CHANNEL:
        case ActionType.BLOCK_CHANNEL: {
            const timestamp = Date.now();
            const newState = {
                ...state,
                processedItems: addProcessedItems(
                    state.processedItems,
                    action.videoIds,
                    VideoStatus.Skipped,
                    timestamp,
                ),
                skippedChannels: new Set(state.skippedChannels).add(action.channelId),
            };

            if (action.type === ActionType.BLOCK_CHANNEL) {
                newState.blockedChannels = new Set(state.blockedChannels).add(action.channelId);
            }

            return newState;
        }

        case ActionType.RESET_QUEUE: {
            return initialState;
        }

        case ActionType.SET_CURRENT_INDEX: {
            return {
                ...state,
                currentIndex: action.index,
            };
        }

        case ActionType.GO_TO_NEXT: {
            return {
                ...state,
                currentIndex: state.currentIndex + 1,
            };
        }

        case ActionType.GO_TO_PREVIOUS: {
            return {
                ...state,
                currentIndex: Math.max(0, state.currentIndex - 1),
            };
        }

        case ActionType.SET_SORTED_ITEMS: {
            return {
                ...state,
                sortedItems: action.items,
                currentIndex: 0,
            };
        }

        default:
            return state;
    }
}

export enum SortOption {
    DEFAULT = "default",
    NEWEST_FIRST = "newest_first",
    OLDEST_FIRST = "oldest_first",
    CHANNEL_NAME = "channel_name",
}

type UseTriageQueueProps = {
    items: Content[];
    sortBy?: SortOption;
    onProcessItem?: (item: Content, status: VideoStatus) => void;
    onSkipChannel?: (channelId: string, videoIds: string[]) => void;
    onBlockChannel?: (channelId: string, videoIds: string[]) => void;
};

export const useTriageQueue = ({
    items,
    sortBy = SortOption.DEFAULT,
    onProcessItem,
    onSkipChannel,
    onBlockChannel,
}: UseTriageQueueProps) => {
    const [state, dispatch] = useReducer(queueReducer, initialState);

    const activeQueue = useMemo(() => {
        return state.sortedItems.filter((item) => {
            const isProcessed = state.processedItems.has(item.id);
            const isChannelSkipped = state.skippedChannels.has(item.artist.id);
            const isChannelBlocked = state.blockedChannels.has(item.artist.id);
            const hasSkippedStatus = item.status === VideoStatus.Skipped;

            return !isProcessed && !isChannelSkipped && !isChannelBlocked && !hasSkippedStatus;
        });
    }, [state.sortedItems, state.processedItems, state.skippedChannels, state.blockedChannels]);

    const currentItem = activeQueue[state.currentIndex] || null;

    useEffect(() => {
        if (items.length === 0) {
            return;
        }

        dispatch({ type: ActionType.SET_SORTED_ITEMS, items: sortContentItems(items, sortBy) });
    }, [items, sortBy]);

    useEffect(() => {
        if (activeQueue.length === 0) return;

        if (state.currentIndex >= activeQueue.length) {
            dispatch({ type: ActionType.SET_CURRENT_INDEX, index: activeQueue.length - 1 });
        } else if (state.currentIndex < 0) {
            dispatch({ type: ActionType.SET_CURRENT_INDEX, index: 0 });
        }
    }, [state.currentIndex, activeQueue.length]);

    const processItem = useCallback(
        (status: VideoStatus) => {
            if (!currentItem) return;

            dispatch({
                type: ActionType.PROCESS_SINGLE_ITEM,
                itemId: currentItem.id,
                status,
            });

            onProcessItem?.(currentItem, status);
        },
        [currentItem, onProcessItem],
    );

    const skipChannel = useCallback(() => {
        if (!currentItem) return;

        const channelId = currentItem.artist.id;
        const channelVideos = items.filter((item) => item.artist.id === channelId);
        const videoIds = channelVideos.map((v) => v.id);

        const bestPosition = findBestPositionAfterChannelRemoval(activeQueue, state.currentIndex, channelId);

        dispatch({
            type: ActionType.SKIP_ALL_FROM_CHANNEL,
            channelId,
            videoIds,
        });

        dispatch({ type: ActionType.SET_CURRENT_INDEX, index: bestPosition });

        channelVideos.forEach((video) => {
            onProcessItem?.(video, VideoStatus.Skipped);
        });

        onSkipChannel?.(channelId, videoIds);
    }, [currentItem, items, activeQueue, state.currentIndex, onProcessItem, onSkipChannel]);

    const blockChannel = useCallback(() => {
        if (!currentItem) return;

        const channelId = currentItem.artist.id;
        const channelVideos = items.filter((item) => item.artist.id === channelId);
        const videoIds = channelVideos.map((v) => v.id);

        const bestPosition = findBestPositionAfterChannelRemoval(activeQueue, state.currentIndex, channelId);

        dispatch({
            type: ActionType.BLOCK_CHANNEL,
            channelId,
            videoIds,
        });

        dispatch({ type: ActionType.SET_CURRENT_INDEX, index: bestPosition });

        onBlockChannel?.(channelId, videoIds);
    }, [currentItem, items, activeQueue, state.currentIndex, onBlockChannel]);

    const goToNext = useCallback(() => {
        if (state.currentIndex < activeQueue.length - 1) {
            dispatch({ type: ActionType.GO_TO_NEXT });
        }
    }, [state.currentIndex, activeQueue.length]);

    const goToPrevious = useCallback(() => {
        if (state.currentIndex > 0) {
            dispatch({ type: ActionType.GO_TO_PREVIOUS });
        }
    }, [state.currentIndex]);

    const goToIndex = useCallback(
        (index: number) => {
            if (index >= 0 && index < activeQueue.length) {
                dispatch({ type: ActionType.SET_CURRENT_INDEX, index });
            }
        },
        [activeQueue.length],
    );

    const resetQueue = useCallback(() => {
        dispatch({ type: ActionType.RESET_QUEUE });
    }, []);

    const getChannelStats = useCallback(
        (channelId: string) => {
            const channelVideos = items.filter((item) => item.artist.id === channelId);
            const processedCount = channelVideos.filter((video) => state.processedItems.has(video.id)).length;

            return {
                total: channelVideos.length,
                processed: processedCount,
                remaining: channelVideos.length - processedCount,
                isSkipped: state.skippedChannels.has(channelId),
                isBlocked: state.blockedChannels.has(channelId),
            };
        },
        [items, state.processedItems, state.skippedChannels, state.blockedChannels],
    );

    const progress = useMemo(() => {
        const total = items.length;
        const processed = state.processedItems.size;
        const remaining = activeQueue.length;
        const percentage = total > 0 ? (processed / total) * 100 : 0;

        return {
            total,
            processed,
            remaining,
            percentage,
            isComplete: remaining === 0,
        };
    }, [items.length, state.processedItems.size, activeQueue.length]);

    return {
        currentItem,
        currentIndex: state.currentIndex + 1,
        activeQueue,
        progress,
        processItem,
        skipChannel,
        blockChannel,
        goToNext,
        goToPrevious,
        goToIndex,
        resetQueue,
        getChannelStats,
        canGoNext: state.currentIndex < activeQueue.length - 1,
        canGoPrevious: state.currentIndex > 0,
        hasItems: activeQueue.length > 0,
    };
};
