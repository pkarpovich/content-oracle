import { createRootRoute, Outlet } from "@tanstack/react-router";

import { Header } from "../components/Header.tsx";
import { Sidebar } from "../components/Sidebar.tsx";
import styles from "./root.module.css";

export const Route = createRootRoute({
    component: () => (
        <div className={styles.rootContainer}>
            <Header />
            <div className={styles.contentContainer}>
                <Sidebar />
                <Outlet />
            </div>
            {/*<TanStackRouterDevtools />*/}
        </div>
    ),
});
