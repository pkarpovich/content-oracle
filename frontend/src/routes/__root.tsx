import "react-toastify/dist/ReactToastify.min.css";

import { createRootRoute, Outlet } from "@tanstack/react-router";
import { clsx } from "clsx";
import { useCallback, useState } from "react";
import { ToastContainer } from "react-toastify";

import { Header } from "../components/Header.tsx";
import { Sidebar } from "../components/Sidebar.tsx";
import styles from "./root.module.css";

const Root = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleMenuClick = useCallback(() => {
        setIsSidebarOpen((prevState) => !prevState);
    }, []);

    return (
        <div
            className={clsx(styles.rootContainer, {
                [styles.sidebarOpen]: isSidebarOpen,
            })}
        >
            <header className={styles.header}>
                <Header onMenuClick={handleMenuClick} />
            </header>
            <aside className={styles.sidebar}>
                <Sidebar isOpen={isSidebarOpen} onClose={handleMenuClick} />
            </aside>
            <main className={styles.content}>
                <Outlet />
            </main>
            <ToastContainer />
            {/*<TanStackRouterDevtools />*/}
        </div>
    );
};

export const Route = createRootRoute({
    component: Root,
});
