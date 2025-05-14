'use client'

import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import { useLocation } from 'wouter'
import { SearchBox } from '@/components/shared/search-box.tsx'
import { useSearch } from '@/lib'

interface Tab {
    title?: string
    icon?: LucideIcon
    type?: string
    href?: string | string[]
}

interface Separator {
    type: 'separator'
    title?: never
    icon?: never
}

type TabItem = Tab

interface ExpandableTabsProps {
    tabs: TabItem[]
    className?: string
    activeColor?: string
    onChange?: (index: number | null) => void
    activeTab?: number
}

const buttonVariants = {
    initial: {
        gap: 0,
        paddingLeft: '.5rem',
        paddingRight: '.5rem',
        width: 'auto',
    },
    animate: (props: { isSelected: boolean; isSearch: boolean }) => ({
        gap: props.isSelected ? '.5rem' : 0,
        paddingLeft: props.isSelected ? '1rem' : '.5rem',
        paddingRight: props.isSelected ? '1rem' : '.5rem',
        // width: props.isSelected && props.isSearch ? '100%' : 'auto',
    }),
}

const spanVariants = {
    initial: { width: 0, opacity: 0 },
    animate: { width: 'auto', opacity: 1 },
    exit: { width: 0, opacity: 0 },
}

const transition = {
    type: 'spring',
    stiffness: 300,
    damping: 25,
    mass: 1,
    bounce: 0,
}

export function ExpandableTabs({ tabs, className, activeColor = 'text-default', onChange, activeTab }: ExpandableTabsProps) {
    const [selected, setSelected] = React.useState<number | null>(null)
    const [location, setLocation] = useLocation()
    const { query } = useSearch()

    // Inside your component before the return statement, add:
    const prevQueryStartsWithBracket = useRef(false)
    const [gradientDirection, setGradientDirection] = useState('forward')

    // Add this effect to track query changes
    useEffect(() => {
        const currentStartsWithBracket = query?.startsWith('[')

        if (currentStartsWithBracket !== prevQueryStartsWithBracket.current) {
            setGradientDirection(currentStartsWithBracket ? 'forward' : 'reverse')
        }

        prevQueryStartsWithBracket.current = currentStartsWithBracket
    }, [query])

    const gradientBorderAnimationClass = `
  relative
  after:content-['']
  after:absolute
  after:pointer-events-none
  after:inset-[-1px]
  after:rounded-[calc(theme(borderRadius.xl)+1px)]
  after:bg-[linear-gradient(-45deg,_#b25aff_0,#e62c6d_8%,#ff530f_17%,#ff9100_25%,#ffc400_33%,theme(colors.amber.500)_34%,theme(colors.amber.500)_40%,theme(colors.indigo.500)_45%,theme(colors.indigo.500)_100%)]
  after:bg-[length:400%_200%]
  after:transition-[background-position,opacity]
  after:ease-out
  after:duration-500
  after:z-0
  after:opacity-0
`

    const handleSelect = (index: number) => {
        setSelected(index)
        onChange?.(index)
        const tab = tabs[index]
        if (tab.href) {
            if (typeof tab.href === 'string') {
                setLocation(tab.href)
            } else if (Array.isArray(tab.href)) {
                // If the href is an array, navigate to the first one
                setLocation(tab.href[0])
            }
        }
    }

    useEffect(() => {
        // Match page href to tab href
        const currentPath = window.location.pathname
        const matchedTab = tabs.find((tab, index) => {
            if (tab.type === 'separator') return false
            if (index === activeTab) return true
            if (tab.href) {
                if (typeof tab.href === 'string') {
                    return currentPath === tab.href.replace(/\/$/, '')
                } else if (Array.isArray(tab.href)) {
                    return tab.href.some(href => currentPath === href.replace(/\/$/, ''))
                }
            }
            return false
        })
        if (matchedTab) {
            const index = tabs.indexOf(matchedTab)
            setSelected(index)
        } else {
            setSelected(null)
        }
    })

    const Separator = () => <div className="mx-1 h-[24px] w-[1.2px] bg-border" aria-hidden="true" />

    return (
        <div className={cn('relative flex items-center gap-2 rounded-2xl border bg-background p-1', className)}>
            {tabs.map((tab, index) => {
                if (tab.type === 'separator') {
                    return <Separator key={`separator-${index}`} />
                }

                const Icon = tab.icon
                return (
                    <motion.button
                        key={tab.title || `tab-${index}`}
                        variants={buttonVariants}
                        initial={false}
                        animate="animate"
                        custom={{ isSelected: selected === index, isSearch: tab.type === 'search' }}
                        onClick={() => handleSelect(index)}
                        transition={transition}
                        className={cn(
                            'relative flex items-center rounded-xl px-4 py-2 text-sm transition-colors font-medium duration-300 !h-9 z-[1]',
                            selected === index ? cn('bg-muted', activeColor) : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                            tab.type === 'search' && gradientBorderAnimationClass,
                            selected === index && query?.startsWith('[')
                                ? `after:opacity-100
                            ${gradientDirection === 'forward' ? 'after:bg-[position:100%_100%]' : 'after:bg-[position:0_0]'}
                            `
                                : ''
                        )}
                        layout
                    >
                        {tab.type === 'search' && (
                            <div
                                className={`bg-muted absolute inset-0 z-[1] rounded transition-opacity opacity-0 duration-300 ${selected === index ? 'opacity-100' : ''}`}
                            />
                        )}
                        {/* floating card if query starts with bracket with text */}
                        {query?.startsWith('[') && selected === index && tab.type === 'search' && (
                            <div className="absolute z-[1] rounded-2xl right-0">
                                <p className="text-sm text-muted-foreground px-4 py-2">whskrd</p>
                            </div>
                        )}
                        {/* The content of your button with proper z-index */}
                        <div className="relative z-[2]">
                            <Icon className="w-5 h-5 flex-shrink-0" />
                        </div>
                        <AnimatePresence initial={false}>
                            {selected === index && tab.type !== 'search' && (
                                <motion.span
                                    variants={spanVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    transition={transition}
                                    className="overflow-hidden whitespace-nowrap relative z-[2]"
                                    layout
                                >
                                    {tab.title}
                                </motion.span>
                            )}

                            {selected === index && tab.type === 'search' && (
                                <motion.div
                                    variants={{
                                        initial: { width: 0, opacity: 0 },
                                        animate: { width: '24rem', opacity: 1 },
                                        exit: { width: 0, opacity: 0 },
                                    }}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    transition={transition}
                                    className="overflow-hidden whitespace-nowrap relative z-[2]"
                                    layout
                                >
                                    <SearchBox />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                )
            })}
        </div>
    )
}
