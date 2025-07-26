import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useState } from "react";

type ContentTriageModalContextType = {
    closeTriageModal: () => void;
    isOpen: boolean;
    openTriageModal: () => void;
};

const ContentTriageModalContext = createContext<ContentTriageModalContextType | null>(null);

export const useContentTriageModal = () => {
    const context = useContext(ContentTriageModalContext);
    if (!context) {
        throw new Error("useContentTriageModal must be used within a ContentTriageModalProvider");
    }
    return context;
};

type Props = {
    children: ReactNode;
};

export const ContentTriageModalProvider = ({ children }: Props) => {
    const [isOpen, setIsOpen] = useState(false);

    const openTriageModal = useCallback(() => {
        setIsOpen(true);
    }, []);

    const closeTriageModal = useCallback(() => {
        setIsOpen(false);
    }, []);

    return (
        <ContentTriageModalContext.Provider
            value={{
                closeTriageModal,
                isOpen,
                openTriageModal,
            }}
        >
            {children}
        </ContentTriageModalContext.Provider>
    );
};
