import { useCallback, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'theme-preference'

const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'dark'
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

const applyTheme = (theme: Theme) => {
    const resolved = theme === 'system' ? getSystemTheme() : theme
    document.documentElement.setAttribute('data-theme', resolved)
}

export const useTheme = () => {
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window === 'undefined') return 'dark'
        const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
        return stored || 'dark'
    })

    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme)
        localStorage.setItem(STORAGE_KEY, newTheme)
        applyTheme(newTheme)
    }, [])

    const toggleTheme = useCallback(() => {
        setTheme(theme === 'dark' ? 'light' : 'dark')
    }, [theme, setTheme])

    useEffect(() => {
        applyTheme(theme)
    }, [theme])

    useEffect(() => {
        if (theme !== 'system') return

        const mediaQuery = window.matchMedia('(prefers-color-scheme: light)')
        const handler = () => applyTheme('system')

        mediaQuery.addEventListener('change', handler)
        return () => mediaQuery.removeEventListener('change', handler)
    }, [theme])

    const resolvedTheme = theme === 'system' ? getSystemTheme() : theme

    return {
        theme,
        resolvedTheme,
        setTheme,
        toggleTheme,
        isDark: resolvedTheme === 'dark',
        isLight: resolvedTheme === 'light',
    }
}
