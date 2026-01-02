import { JSX, SVGProps, useEffect, useRef, useState } from 'react'
import useLocalStorage from '@/lib/hooks/use-local-storage.ts'
import { supabase } from '@/lib/api'
import { useUserAccountStore } from '@/lib/index'

function SunIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
            <path d="M12.5 10a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" />
            <path
                strokeLinecap="round"
                d="M10 5.5v-1M13.182 6.818l.707-.707M14.5 10h1M13.182 13.182l.707.707M10 15.5v-1M6.11 13.889l.708-.707M4.5 10h1M6.11 6.111l.708.707"
            />
        </svg>
    )
}

function MoonIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
            <path d="M15.224 11.724a5.5 5.5 0 0 1-6.949-6.949 5.5 5.5 0 1 0 6.949 6.949Z" />
        </svg>
    )
}

export function ThemeToggle() {
    const [theme, setTheme] = useLocalStorage('theme', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    const [loaded, setLoaded] = useState(false)
    const isFetching = useRef(false)
    const { user } = useUserAccountStore()

    useEffect(() => {
        if (!user) return setLoaded(true)
        if (loaded) return
        if (isFetching.current) return
        isFetching.current = true
        supabase.auth.getUser().then(({ data, error }) => {
            isFetching.current = false
            if (error) return
            const doTheme = data?.user?.user_metadata?.theme
            log.info('Theme', 'Got user theme:', doTheme)
            setLoaded(true)
            if (doTheme) setTheme(doTheme)
        })
    }, [])

    useEffect(() => {
        if (user && !loaded && theme === 'light') return
        log.info('Theme', 'Setting theme:', theme)
        document.documentElement.classList.remove('light', 'dark')
        document.documentElement.classList.add(theme)

        if (user && loaded) {
            log.info('Theme', 'Updating user theme:', theme)
            supabase.auth
                .updateUser({
                    data: { theme },
                })
                .catch(e => {
                    log.error('Theme', 'Failed to update user theme:', e)
                })
        }
    }, [theme, loaded])

    return (
        <button
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded-md transition hover:bg-zinc-900/5 dark:hover:bg-white/5"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        >
            <SunIcon className="h-5 w-5 stroke-zinc-900 dark:hidden" />
            <MoonIcon className="hidden h-5 w-5 stroke-white dark:block" />
        </button>
    )
}
