import { ActionButton } from "../../../components/ActionButton.tsx";
import { BottomSheet } from "../../../components/BottomSheet.tsx";
import { Typography } from "../../../components/Typography.tsx";
import AppleTvIcon from "../../../icons/apple-tv.svg";
import BoringIcon from "../../../icons/boring.svg";
import CheckIcon from "../../../icons/check.svg";
import EnterIcon from "../../../icons/enter.svg";
import ShareIcon from "../../../icons/share.svg";
import SkipIcon from "../../../icons/previous.svg";
import type { Artist } from "../../../api/content.ts";
import { Category } from "../../../api/content.ts";
import styles from "./ContentCard.module.css";

type Props = {
    artist: Artist;
    category: Category;
    isOpen: boolean;
    onBoringButtonClick: () => void;
    onCheckButtonClick: () => void;
    onClose: () => void;
    onOpenButtonClick: () => void;
    onSendToTvButtonClick: () => void;
    onShareButtonClick: () => void;
    onSkipButtonClick: () => void;
    title: string;
};

export const ContentCardBottomSheet = ({
    artist,
    category,
    isOpen,
    onBoringButtonClick,
    onCheckButtonClick,
    onClose,
    onOpenButtonClick,
    onSendToTvButtonClick,
    onShareButtonClick,
    onSkipButtonClick,
    title,
}: Props) => {
    const allowBoringAction = category === Category.unsubscribedChannels;

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose}>
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
                    onClick={onOpenButtonClick}
                    title="Open Content"
                />

                <ActionButton
                    description="Copy the video URL to clipboard"
                    icon={<ShareIcon />}
                    onClick={onShareButtonClick}
                    title="Copy Link"
                />

                <ActionButton
                    description="Play this content on your TV"
                    icon={<AppleTvIcon />}
                    onClick={onSendToTvButtonClick}
                    title="Send to TV"
                />

                <ActionButton
                    description="Mark as watched and remove from suggestions"
                    icon={<CheckIcon />}
                    onClick={onCheckButtonClick}
                    title="Mark as Watched"
                />

                <ActionButton
                    description="Skip this video and remove from suggestions"
                    icon={<SkipIcon />}
                    onClick={onSkipButtonClick}
                    title="Skip Video"
                />

                {allowBoringAction && (
                    <ActionButton
                        description="Hide all content from this channel"
                        icon={<BoringIcon />}
                        onClick={onBoringButtonClick}
                        title="Block Channel"
                    />
                )}
            </div>
        </BottomSheet>
    );
};