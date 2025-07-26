import { memo, useState, useCallback } from 'react';
import { getVideoThumbnail } from '../utils/youtube.ts';
import styles from './ResponsiveThumbnail.module.css';

type ResponsiveThumbnailProps = {
    src: string;
    alt: string;
    className?: string;
    loading?: 'lazy' | 'eager';
    onError?: () => void;
    fallbackSrc?: string;
    showLoader?: boolean;
    loaderElement?: React.ReactNode;
};

export const ResponsiveThumbnail = memo(({
    src,
    alt,
    className,
    loading = 'lazy',
    onError,
    fallbackSrc,
    showLoader = true,
    loaderElement
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
            {showLoader && isLoading && !hasError && (loaderElement || defaultLoader)}
            <picture className={styles.image} style={{ opacity: isLoading ? 0 : 1 }}>
                <source 
                    media="(min-width: 601px)" 
                    srcSet={thumbnailData?.desktop || fallbackSrc} 
                />
                <source 
                    media="(max-width: 600px)" 
                    srcSet={thumbnailData?.mobile || fallbackSrc} 
                />
                <img 
                    alt={alt}
                    loading={loading}
                    className={className} 
                    onError={handleError}
                    onLoad={handleLoad}
                    src={thumbnailData?.fallback || fallbackSrc}
                />
            </picture>
        </div>
    );
});

ResponsiveThumbnail.displayName = 'ResponsiveThumbnail';