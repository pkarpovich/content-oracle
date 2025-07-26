import { lazy, Suspense } from "react";

import { useContentTriageModal } from "../contexts/ContentTriageModalContext.tsx";

const ContentTriageModal = lazy(() =>
    import("./ContentTriageModal.tsx").then((module) => ({
        default: module.ContentTriageModal,
    })),
);

export const GlobalContentTriageModal = () => {
    const { closeTriageModal, isOpen } = useContentTriageModal();

    if (!isOpen) {
        return null;
    }

    return (
        <Suspense fallback={null}>
            <ContentTriageModal isOpen={isOpen} onClose={closeTriageModal} />
        </Suspense>
    );
};
