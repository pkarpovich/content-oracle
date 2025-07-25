import "react-toastify/dist/ReactToastify.min.css";

import { createRootRoute, Outlet } from "@tanstack/react-router";
import { ToastContainer } from "react-toastify";

import { Header } from "../components/Header.tsx";
import { ContentCardBottomSheetProvider } from "../contexts/ContentCardBottomSheetContext.tsx";
import { GlobalContentCardBottomSheet } from "../components/GlobalContentCardBottomSheet.tsx";
import styles from "./root.module.css";

const Root = () => {
    return (
        <ContentCardBottomSheetProvider>
            <div className={styles.rootContainer}>
                <header className={styles.header}>
                    <Header />
                </header>
                <main className={styles.content}>
                    <Outlet />
                </main>
                <ToastContainer />
                <GlobalContentCardBottomSheet />
                {/*<TanStackRouterDevtools />*/}
            </div>
        </ContentCardBottomSheetProvider>
    );
};

export const Route = createRootRoute({
    component: Root,
});
