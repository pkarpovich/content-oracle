import { memo, type ReactNode, useCallback, useState } from "react";

import { getVideoThumbnail } from "../utils/youtube.ts";
import styles from "./ResponsiveThumbnail.module.css";

type ResponsiveThumbnailProps = {
    alt: string;
    className?: string;
    fallbackSrc?: string;
    loaderElement?: ReactNode;
    loading?: "eager" | "lazy";
    onError?: () => void;
    showLoader?: boolean;
    src: string;
};

export const ResponsiveThumbnail = memo(
    ({
        alt,
        className,
        fallbackSrc,
        loaderElement,
        loading = "lazy",
        onError,
        showLoader = true,
        src,
    }: ResponsiveThumbnailProps) => {
        const [isLoading, setIsLoading] = useState(true);
        const [hasError, setHasError] = useState(false);

        const thumbnailData = getVideoThumbnail(src);

        const handleLoad = useCallback(() => {
            setIsLoading(false);
        }, []);

        const handleError = useCallback(() => {
            setIsLoading(false);
            setHasError(true);
            onError?.();
        }, [onError]);

        const defaultLoader = <div className={styles.loader} />;

        return (
            <div className={styles.container}>
                {showLoader && isLoading && !hasError ? (loaderElement ?? defaultLoader) : null}
                <picture className={styles.image} style={{ opacity: isLoading ? 0 : 1 }}>
                    <source media="(min-width: 601px)" srcSet={thumbnailData?.desktop ?? fallbackSrc} />
                    <source media="(max-width: 600px)" srcSet={thumbnailData?.mobile ?? fallbackSrc} />
                    <img
                        alt={alt}
                        className={className}
                        loading={loading}
                        onError={handleError}
                        onLoad={handleLoad}
                        src={thumbnailData?.fallback ?? fallbackSrc}
                    />
                </picture>
            </div>
        );
    },
);

ResponsiveThumbnail.displayName = "ResponsiveThumbnail";
