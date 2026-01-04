import clsx from 'clsx'
import {Children, ComponentType, isValidElement, KeyboardEvent, ReactElement, ReactNode, useCallback, useId, useMemo, useState} from 'react'

type IconComponent = ComponentType<{ className?: string }>

export type TabProps = {
    title: string
    icon?: IconComponent
    children?: ReactNode
}

export function Tab(_props: TabProps) {
    return null
}

export type TabsLayoutProps = {
    children: ReactNode
    className?: string
    headerClassName?: string
    contentClassName?: string
    defaultIndex?: number
    selectedIndex?: number
    onChange?: (index: number) => void
    prefix?: ReactNode
    suffix?: ReactNode
}

function getTabsFromChildren(children: ReactNode) {
    return Children.toArray(children).filter(isValidElement) as ReactElement<TabProps>[]
}

export function TabsLayout({
                               children,
                               className,
                               headerClassName,
                               contentClassName,
                               defaultIndex = 0,
                               selectedIndex,
                               onChange,
                               prefix,
                               suffix,
                           }: TabsLayoutProps) {
    const tabs = useMemo(() => getTabsFromChildren(children), [children])
    const isControlled = typeof selectedIndex === 'number'
    const [uncontrolledIndex, setUncontrolledIndex] = useState(defaultIndex)
    const activeIndex = isControlled ? (selectedIndex as number) : uncontrolledIndex
    const setActiveIndex = useCallback(
        (next: number) => {
            if (onChange) onChange(next)
            if (!isControlled) setUncontrolledIndex(next)
        },
        [isControlled, onChange]
    )

    const listId = useId()

    const onKeyDown = useCallback(
        (event: KeyboardEvent<HTMLDivElement>) => {
            if (!tabs.length) return
            let next = activeIndex
            if (event.key === 'ArrowRight') next = (activeIndex + 1) % tabs.length
            if (event.key === 'ArrowLeft') next = (activeIndex - 1 + tabs.length) % tabs.length
            if (event.key === 'Home') next = 0
            if (event.key === 'End') next = tabs.length - 1
            if (next !== activeIndex) {
                event.preventDefault()
                setActiveIndex(next)
                const btn = document.querySelector<HTMLButtonElement>(`#${listId}-tab-${next}`)
                btn?.focus()
            }
        },
        [activeIndex, listId, setActiveIndex, tabs.length]
    )

    return (
        <div className={clsx('flex flex-col', className)}>
            <div className={clsx('inline-flex items-center gap-1 text-sm/6', headerClassName)}>
                {prefix ? <div>{prefix}</div> : null}
                <div role="tablist" aria-orientation="horizontal" className="flex items-center gap-2"
                     onKeyDown={onKeyDown}>
                    {tabs.map((tab, index) => {
                        const selected = index === activeIndex
                        const Icon = tab.props.icon
                        return (
                            <button
                                key={index}
                                id={`${listId}-tab-${index}`}
                                role="tab"
                                type="button"
                                aria-selected={selected}
                                aria-controls={`${listId}-panel-${index}`}
                                tabIndex={selected ? 0 : -1}
                                onClick={() => setActiveIndex(index)}
                                className={clsx(
                                    'group relative inline-flex items-center border-t-[0.1rem] border-x-[0.1rem] gap-2 rounded-t-2xl px-4 py-3 font-medium transition-all',
                                    selected
                                        ? `bg-white !z-20 dark:bg-n-8`
                                        : 'text-muted-foreground  hover:bg-card'
                                )}
                            >
                                {Icon ? (
                                    <Icon
                                        className={clsx(
                                            'h-5 w-5',
                                            selected ? 'fill-indigo-500' : 'fill-indigo-500/80 group-hover:fill-indigo-500'
                                        )}
                                    />
                                ) : null}
                                <span className="truncate">{tab.props.title}</span>
                            </button>
                        )
                    })}
                </div>
                {suffix ? <div className="ml-auto">{suffix}</div> : null}
            </div>

            {/* Content */}
            <div
                id={`${listId}-panel-${activeIndex}`}
                role="tabpanel"
                aria-labelledby={`${listId}-tab-${activeIndex}`}
                className={clsx('min-w-0 -mt-[1.5px]', contentClassName)}
            >
                {tabs[activeIndex]?.props.children}
            </div>
        </div>
    )
}

TabsLayout.Tab = Tab

export default TabsLayout
