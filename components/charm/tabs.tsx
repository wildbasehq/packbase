import {ComponentClass, Fragment, FunctionComponent, useEffect, useMemo, useRef, useState} from 'react'
import { Menu, Transition } from "@headlessui/react"
import { useFloating, shift, FloatingPortal } from "@floating-ui/react"

function classNames(...classes: (string | boolean)[]) {
    return classes.filter(Boolean).join(" ")
}

/**
 * CharmingTabs component
 *
 * @param {object} props
 * @param {object} props.items Array of items with labels and tab props
 * @param {string | React.ElementType} [props.tabComponent='a'] The component to use for tabs
 * @param {number} props.selectedIndex The selected tab index
 * @param {function} props.onChange Called when the active tab changes
 */
export default function CharmingTabs({items, tabComponent: TabComponent = "a", selectedIndex = 0, onChange,}: {
    items: { label: string; [key: string]: any }[];
    tabComponent?: string | React.ElementType;
    selectedIndex: number;
    onChange: (index: number) => void;
}) {
    const [mousePosition, setMousePosition] = useState<{
        x: number | null;
        y: number | null;
    }>({ x: null, y: null })
    const [activeElement, setActiveElement] = useState<HTMLDivElement | null>(null)
    const ref = useRef<HTMLDivElement>(null)

    // Mobile menu panel positioning
    const { refs, floatingStyles } = useFloating({
        placement: "bottom",
        middleware: [shift({ padding: 8 })],
    })

    // Track relative mouse position
    useEffect(() => {
        const handler = (e: { clientX: number; clientY: number; }) => {
            if (!ref.current) return

            const boundingRect = ref.current.getBoundingClientRect()
            setMousePosition({
                x: (e.clientX - boundingRect.left) / boundingRect.width,
                y: (e.clientY - boundingRect.top) / boundingRect.height,
            })
        }
        window.addEventListener("mousemove", handler)

        return () => window.removeEventListener("mousemove", handler)
    }, [])

    // Position (x) of active item for highlight
    const activeX = useMemo(() => {
        if (!activeElement || !ref.current) return null

        const activeRect = activeElement.getBoundingClientRect()
        return (
            activeRect.x +
            activeRect.width / 2 -
            ref.current.getBoundingClientRect().x
        )
    }, [activeElement, ref])

    return (
        <Menu as="div" className="relative">
            {({ open }) => (
                <>
                    <div
                        ref={ref}
                        className="group relative overflow-hidden rounded-full bg-[#60a5fa44] p-[2px] shadow-sm"
                        style={{
                            transform: "translateZ(0)",
                            backfaceVisibility: "hidden",
                        }}
                    >
                        {/* Desktop items (>= md) */}
                        <div className="hidden md:block">
                            {/* Active background */}
                            <div
                                className="absolute top-1/2 block aspect-square h-[250%] transition-transform duration-200"
                                style={{
                                    transform: `translateX(calc(${activeX}px - 50%)) translateY(-50%)`,
                                    backgroundImage: activeX
                                        ? " radial-gradient(#af91ff, transparent 80%) "
                                        : undefined,
                                }}
                            ></div>

                            {/* Hover background */}
                            <div
                                className="absolute inset-0 block opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                                style={{
                                    transform: `translateX(calc(${
                                        mousePosition.x ? (mousePosition.x - 0.5) * 100 : 0
                                    }%))`,
                                    backgroundImage: activeX
                                        ? " radial-gradient(circle at 50% 50%, #af91ff66, transparent 70%) "
                                        : undefined,
                                }}
                            ></div>
                            <div className="relative flex items-center rounded-full bg-white/90 px-2">
                                {items.map((item, idx) => (
                                    <DesktopTab
                                        key={idx}
                                        as={TabComponent}
                                        isActive={idx === selectedIndex}
                                        setActiveElement={setActiveElement}
                                        onClick={
                                            item.target !== "_blank" ? () => onChange(idx) : undefined
                                        }
                                        {...item}
                                    />
                                ))}
                            </div>

                            {/* Active foreground */}
                            <div
                                className="pointer-events-none absolute left-0 top-0 h-full w-32 transition-transform duration-200"
                                style={{
                                    transform: `translateX(calc(${activeX}px - 50%))`,
                                    backgroundImage: activeX
                                        ? " radial-gradient(100% 75% at 50% 130%, #60a5faff, transparent 60%) "
                                        : undefined,
                                }}
                            ></div>
                        </div>

                        {/* Mobile button (< md) */}
                        <div className="block md:hidden">
                            <>
                                <Menu.Button
                                    ref={refs.setReference}
                                    className="group peer relative flex rounded-full bg-white/90 p-2 outline-none transition-colors active:bg-white/80 md:hidden"
                                >
                                    <MenuIcon isOpen={open} />
                                </Menu.Button>

                                {/* Focus/hover background */}
                                <div className="absolute inset-0 -z-[1] block bg-[#af91ff] opacity-20 transition-opacity duration-100 group-hover:opacity-70 peer-focus:opacity-100 md:hidden"></div>
                            </>
                        </div>
                    </div>

                    {/* Mobile items (< md) */}
                    {open && (
                        <FloatingPortal>
                            <Menu.Items
                                className="group focus:outline-none md:hidden"
                                ref={refs.setFloating}
                                style={floatingStyles}
                            >
                                <Transition
                                    as={Fragment}
                                    appear={true}
                                    enter="transition duration-100 ease-out"
                                    enterFrom="transform scale-95 opacity-0"
                                    enterTo="transform scale-100 opacity-100"
                                    leave="transition duration-75 ease-out"
                                    leaveFrom="transform scale-100 opacity-100"
                                    leaveTo="transform scale-95 opacity-0"
                                >
                                    <div className="mt-3 origin-top-right rounded-[0.75rem] bg-[#60a5fa88] p-[2px]">
                                        <div className="rounded-[calc(0.75rem-2px)] bg-white/[0.95] py-1 pr-4 shadow-md">
                                            {items.map((item, idx) => (
                                                <MobileTab
                                                    key={idx}
                                                    as={TabComponent}
                                                    isActive={idx === selectedIndex}
                                                    onClick={() => {
                                                        close()
                                                        onChange(idx)
                                                    }}
                                                    {...item}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </Transition>
                            </Menu.Items>
                        </FloatingPortal>
                    )}
                </>
            )}
        </Menu>
    )
}

function DesktopTab({as: Component, label, isActive, setActiveElement, ...rest}: {
    as: string | React.ElementType;
    label: string;
    isActive: boolean;
    setActiveElement: (element: HTMLDivElement | null) => void;
    [key: string]: any;
}) {
    const ref = useRef(null)

    useEffect(() => {
        if (isActive && ref.current) {
            setActiveElement(ref.current)
        }
    }, [isActive, setActiveElement])

    return (
        <Component
            ref={ref}
            className={classNames(
                "group flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium outline-none transition-colors duration-200 lg:px-6",
                isActive
                    ? "text-indigo-900 focus:text-indigo-950"
                    : "text-slate-500 hover:text-slate-700 focus:text-slate-700",
            )}
            {...rest}
        >
            <div
                className={classNames(
                    "block h-1 w-1 rounded-full transition-transform duration-200",
                    isActive
                        ? "scale-100 bg-indigo-600 group-focus:bg-indigo-800"
                        : "scale-0 bg-gray-600 group-focus:scale-100",
                )}
            ></div>
            {label}
        </Component>
    )
}

function MobileTab({ as, label, isActive, ...rest }: {
    as: any;
    label: string;
    isActive: boolean;
    [key: string]: any;
}) {
    return (
        <Menu.Item
            as={as}
            className={classNames(
                "group/item flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium outline-none transition-colors duration-200 lg:px-6",
                isActive
                    ? "text-indigo-900 focus:text-indigo-950"
                    : "text-slate-500 hover:text-slate-700 focus:text-slate-700",
            )}
            {...rest}
        >
            {({ active }) => (
                <>
                    <div
                        className={classNames(
                            "block h-1 w-1 rounded-full transition-transform duration-200",
                            isActive
                                ? "group/item-focus:bg-indigo-800 scale-100 bg-indigo-600"
                                : classNames(
                                    "group/item-focus:scale-100 bg-gray-600",
                                    active ? "scale-100" : "scale-0",
                                ),
                        )}
                    ></div>
                    {label}
                </>
            )}
        </Menu.Item>
    )
}

// Menu icon that animates between hamburger and X
function MenuIcon({ isOpen = false }) {
    return (
        <div className="flex h-6 w-6 flex-col justify-between px-[0.2rem] py-[0.35rem]">
            {[...Array(3)].map((_, outerIdx) => (
                <div key={outerIdx} className="relative">
                    {[...Array(outerIdx === 1 ? 2 : 1)].map((_, innerIdx) => (
                        <div
                            key={innerIdx}
                            className={classNames(
                                "h-0.5 w-full rounded-full bg-slate-500 transition-all duration-150 group-hover:bg-slate-600",
                                innerIdx === 1 && "absolute top-0",
                                isOpen &&
                                classNames(
                                    innerIdx === 1 && "rotate-45",
                                    outerIdx === 1 && innerIdx === 0 && "-rotate-45",
                                    outerIdx === 0 && "translate-y-full scale-75 opacity-0",
                                    outerIdx === 2 && "-translate-y-full scale-75 opacity-0",
                                ),
                            )}
                        ></div>
                    ))}
                </div>
            ))}
        </div>
    )
}