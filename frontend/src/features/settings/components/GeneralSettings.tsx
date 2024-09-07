import { Button } from "../../../components/Button.tsx";
import { Typography } from "../../../components/Typography.tsx";
import { useCleanSettings } from "../api/useCleanSettings.ts";
import styles from "./GeneralSettings.module.css";

export const GeneralSettings = () => {
    const { mutate: cleanSettings } = useCleanSettings();

    return (
        <div className={styles.container}>
            <Typography variant="h1">General Settings</Typography>
            <div>
                <Button onClick={cleanSettings}>Reset YouTube Settings</Button>
            </div>
        </div>
    );
};
