import { useCallback, useState } from "react";

type Popup = {
    close: () => void;
    isOpen: boolean;
    open: () => void;
    toggle: () => void;
};

export const usePopup = (): Popup => {
    const [isOpen, setIsOpen] = useState(false);

    const open = useCallback(() => {
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
    }, []);

    const toggle = useCallback(() => {
        setIsOpen((prev) => !prev);
    }, []);

    return {
        close,
        isOpen,
        open,
        toggle,
    };
};
