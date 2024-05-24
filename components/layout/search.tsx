'use client'

import {
    useCallback,
    useEffect,
    useId,
    useRef,
    useState,
} from 'react'
import Highlighter from 'react-highlight-words'

function SearchIcon(props: any) {
    return (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12.01 12a4.25 4.25 0 1 0-6.02-6 4.25 4.25 0 0 0 6.02 6Zm0 0 3.24 3.25"
            />
        </svg>
    )
}

function NoResultsIcon(props: any) {
    return (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12.01 12a4.237 4.237 0 0 0 1.24-3c0-.62-.132-1.207-.37-1.738M12.01 12A4.237 4.237 0 0 1 9 13.25c-.635 0-1.237-.14-1.777-.388M12.01 12l3.24 3.25m-3.715-9.661a4.25 4.25 0 0 0-5.975 5.908M4.5 15.5l11-11"
            />
        </svg>
    )
}

function LoadingIcon(props: any) {
    let id = useId()

    return (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
            <circle cx="10" cy="10" r="5.5" strokeLinejoin="round" />
            <path
                stroke={`url(#${id})`}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.5 10a5.5 5.5 0 1 0-5.5 5.5"
            />
            <defs>
                <linearGradient
                    id={id}
                    x1="13"
                    x2="9.5"
                    y1="9"
                    y2="15"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="currentColor" />
                    <stop offset="1" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
            </defs>
        </svg>
    )
}

function HighlightQuery({ text, query }: { text: string; query: string }) {
    return (
        <Highlighter
            highlightClassName="underline bg-transparent text-indigo-500"
            searchWords={[query]}
            autoEscape={true}
            textToHighlight={text}
        />
    )
}

function useSearchProps() {
    let buttonRef = useRef<HTMLButtonElement>(null)
    let [open, setOpen] = useState(false)

    return {
        buttonProps: {
            ref: buttonRef,
            onClick() {
                setOpen(true)
            },
        },
        dialogProps: {
            open,
            // setOpen(open) {
            //   let { width, height } = buttonRef.current.getBoundingClientRect()
            //   if (!open || (width !== 0 && height !== 0)) {
            //     setOpen(open)
            //   }
            // },
            setOpen: useCallback(
                (open: boolean | ((prevState: boolean) => boolean)) => {
                    let { width, height } = buttonRef?.current?.getBoundingClientRect() || { width: 0, height: 0 }
                    if (!open || (width !== 0 && height !== 0)) {
                        setOpen(open)
                    }
                },
                [setOpen]
            ),
        },
    }
}

export function Search() {
    let [modifierKey, setModifierKey] = useState<string>()
    let { buttonProps, dialogProps } = useSearchProps()

    useEffect(() => {
        setModifierKey(
            /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform) ? '⌘' : 'Ctrl '
        )
    }, [])

    return (
        <div className="hidden lg:block lg:max-w-md lg:flex-auto">
            <button
                type="button"
                className="hidden h-8 w-full items-center gap-2 rounded-md bg-white pl-2 pr-3 text-sm text-zinc-500 ring-1 ring-zinc-900/10 transition hover:ring-zinc-900/20 ui-not-focus-visible:outline-none dark:bg-white/5 dark:text-zinc-400 dark:ring-inset dark:ring-white/10 dark:hover:ring-white/20 lg:flex"
                {...buttonProps}
            >
                <SearchIcon className="h-5 w-5 stroke-current" />
                Find something...
                <kbd className="ml-auto text-2xs text-zinc-400 dark:text-zinc-500">
                    <kbd className="font-sans">{modifierKey}</kbd>
                    <kbd className="font-sans">K</kbd>
                </kbd>
            </button>
        </div>
    )
}

export function MobileSearch() {
    let { buttonProps, dialogProps } = useSearchProps()

    return (
        <div className="contents lg:hidden">
            <button
                type="button"
                className="flex h-6 w-6 items-center justify-center rounded-md transition hover:bg-zinc-900/5 ui-not-focus-visible:outline-none dark:hover:bg-white/5 lg:hidden"
                aria-label="Find something..."
                {...buttonProps}
            >
                <SearchIcon className="h-5 w-5 stroke-zinc-900 dark:stroke-white" />
            </button>
        </div>
    )
}
