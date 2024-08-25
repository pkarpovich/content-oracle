import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useCallback, useState } from "react";

import { Header } from "../components/Header.tsx";
import { Sidebar } from "../components/Sidebar.tsx";
import styles from "./root.module.css";

export const Route = createRootRoute({
    component: () => {
        const [isSidebarOpen, setIsSidebarOpen] = useState(false);

        const handleMenuClick = useCallback(() => {
            setIsSidebarOpen((prevState) => !prevState);
        }, []);

        return (
            <div className={styles.rootContainer}>
                <Header onMenuClick={handleMenuClick} />
                <div className={styles.contentContainer}>
                    <Sidebar isOpen={isSidebarOpen} />
                    <Outlet />
                </div>
                {/*<TanStackRouterDevtools />*/}
            </div>
        );
    },
});
