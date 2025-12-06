import { useTheme } from '../hooks/useTheme'
import MoonIcon from '../icons/moon.svg'
import SunIcon from '../icons/sun.svg'
import style from './ThemeToggle.module.css'

export const ThemeToggle = () => {
    const { isDark, toggleTheme } = useTheme()

    return (
        <button
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            className={style.button}
            onClick={toggleTheme}
            type="button"
        >
            {isDark ? <SunIcon /> : <MoonIcon />}
        </button>
    )
}
