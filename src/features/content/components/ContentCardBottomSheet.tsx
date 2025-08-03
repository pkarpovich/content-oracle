import { memo, useCallback } from "react";

import { type Artist, VideoStatus } from "../../../api/content.ts";
import { Category } from "../../../api/content.ts";
import { ActionButton } from "../../../components/ActionButton.tsx";
import { BottomSheet } from "../../../components/BottomSheet.tsx";
import { Typography } from "../../../components/Typography.tsx";
import BookmarkIcon from "../../../icons/add-bookmark.svg";
import AppleTvIcon from "../../../icons/apple-tv.svg";
import BoringIcon from "../../../icons/boring.svg";
import CheckIcon from "../../../icons/check.svg";
import CloseIcon from "../../../icons/close.svg";
import EnterIcon from "../../../icons/enter.svg";
import SkipIcon from "../../../icons/previous.svg";
import ShareIcon from "../../../icons/share.svg";
import { useBlockChannel } from "../api/useBlockChannel.ts";
import { useMarkVideoStatus } from "../api/useMarkVideoStatus.ts";
import styles from "./ContentCard.module.css";

type Props = {
    artist: Artist;
    category: Category;
    id: string;
    onClose: () => void;
    onOpenUrl?: (url: string) => void;
    title: string;
    url: string;
};

export const ContentCardBottomSheet = memo(({ artist, category, id, onClose, onOpenUrl, title, url }: Props) => {
    const { mutate: blockChannelMutation } = useBlockChannel();
    const { mutate: markVideoStatusMutation } = useMarkVideoStatus();

    const allowBoringAction = category === Category.unsubscribedChannels;
    const isWatchLater = category === Category.watchLater;

    const handleOpenButtonClick = useCallback(() => {
        window.open(url, "_blank");
        onClose();
    }, [url, onClose]);

    const handleShareButtonClick = useCallback(async () => {
        await navigator.clipboard.writeText(url);
        onClose();
    }, [url, onClose]);

    const handleSendToTvButtonClick = useCallback(() => {
        onOpenUrl?.(url);
        onClose();
    }, [onOpenUrl, url, onClose]);

    const handleCheckButtonClick = useCallback(() => {
        markVideoStatusMutation({ status: VideoStatus.Watched, videoId: id });
        onClose();
    }, [id, markVideoStatusMutation, onClose]);

    const handleBoringButtonClick = useCallback(() => {
        blockChannelMutation({
            channelId: artist.id,
        });
        onClose();
    }, [artist.id, blockChannelMutation, onClose]);

    const handleSkipButtonClick = useCallback(() => {
        markVideoStatusMutation({ status: VideoStatus.Skipped, videoId: id });
        onClose();
    }, [id, markVideoStatusMutation, onClose]);

    const handleSaveForLaterButtonClick = useCallback(() => {
        markVideoStatusMutation({
            status: category === Category.watchLater ? VideoStatus.None : VideoStatus.WatchLater,
            videoId: id,
        });
        onClose();
    }, [category, id, markVideoStatusMutation, onClose]);

    return (
        <BottomSheet isOpen={true} onClose={onClose}>
            <div className={styles.bottomSheetHeader}>
                <Typography className={styles.bottomSheetTitle} variant="text">
                    {title}
                </Typography>
                <Typography className={styles.bottomSheetArtist} variant="text">
                    by {artist.name}
                </Typography>
            </div>

            <div className={styles.actions}>
                <ActionButton
                    description="Watch this video in a new tab"
                    icon={<EnterIcon />}
                    onClick={handleOpenButtonClick}
                    title="Open Content"
                />

                <ActionButton
                    description="Copy the video URL to clipboard"
                    icon={<ShareIcon />}
                    onClick={handleShareButtonClick}
                    title="Copy Link"
                />

                <ActionButton
                    description="Play this content on your TV"
                    icon={<AppleTvIcon />}
                    onClick={handleSendToTvButtonClick}
                    title="Send to TV"
                />

                {isWatchLater ? (
                    <ActionButton
                        description="Remove this video from watch later"
                        icon={<CloseIcon />}
                        onClick={handleSaveForLaterButtonClick}
                        title="Remove from Watch Later"
                    />
                ) : (
                    <ActionButton
                        description="Save this video to watch later"
                        icon={<BookmarkIcon />}
                        onClick={handleSaveForLaterButtonClick}
                        title="Save for Later"
                    />
                )}

                <ActionButton
                    description="Mark as watched and remove from suggestions"
                    icon={<CheckIcon />}
                    onClick={handleCheckButtonClick}
                    title="Mark as Watched"
                />

                <ActionButton
                    description="Skip this video and remove from suggestions"
                    icon={<SkipIcon />}
                    onClick={handleSkipButtonClick}
                    title="Skip Video"
                />

                {allowBoringAction ? (
                    <ActionButton
                        description="Hide all content from this channel"
                        icon={<BoringIcon />}
                        onClick={handleBoringButtonClick}
                        title="Block Channel"
                    />
                ) : null}
            </div>
        </BottomSheet>
    );
});
