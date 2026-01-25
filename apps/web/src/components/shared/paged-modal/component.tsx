import {Text} from '@/components/shared/text'
import {cn} from '@/lib'
import {Bars3Icon, XMarkIcon} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {AnimatePresence, motion} from 'motion/react'
import {Activity, ElementType, FC, ReactNode, useEffect, useState} from 'react'
import {PagedModalProvider, usePagedModal} from './context'

export interface PageProps {
    id?: string
    title: string
    description?: string | ReactNode
    icon?: ElementType
    badge?: string
    children: ReactNode
}

export interface PagedModalProps {
    children: ReactNode
    className?: string
    header?: ReactNode
    footer?: ReactNode
}

// The Page component that represents each tab/page in the modal
const Page: FC<PageProps> = ({id: providedId, title, description, icon: Icon, badge, children}) => {
    const {registerPage, activePage} = usePagedModal()
    const id = providedId || title.toLowerCase().replace(/\s+/g, '-')

    useEffect(() => {
        registerPage(id, {title, description, icon: Icon, badge})
    }, [id, title, description, Icon, badge])

    if (activePage !== id) return null

    return <>{children}</>
}

const PageBody: FC<{ children: ReactNode; className?: string; }> = ({children, className}) => {
    return <div className={cn('h-full w-full overflow-y-auto relative', className)}>{children}</div>
}

// The main PagedModal component
const PagedModal: FC<PagedModalProps> & { Page: typeof Page; Body: typeof PageBody } = ({
                                                                                            children,
                                                                                            className,
                                                                                            header,
                                                                                            footer
                                                                                        }) => {
    return (
        <PagedModalProvider>
            <PagedModalContent className={className} header={header} footer={footer}>
                {children}
            </PagedModalContent>
        </PagedModalProvider>
    )
}

// The internal content component that uses the context
const PagedModalContent: FC<PagedModalProps> = ({children, className, header, footer}) => {
    const {activePage, setActivePage, pages} = usePagedModal()
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Header */}
            {header && <div className="p-4 border-b">{header}</div>}

            {/* Navigation */}
            <nav className="flex-1 p-4 overflow-y-auto">
                <ul className="space-y-2">
                    {Object.values(pages).map(page => {
                        return (
                            <li
                                key={page.id}
                                onClick={() => {
                                    setActivePage(page.id)
                                    setIsMobileSidebarOpen(false)
                                }}
                                className={clsx(
                                    activePage === page.id ? 'bg-muted' : 'hover:bg-muted',
                                    'ring-default group w-full items-center justify-start gap-4 rounded px-4 py-3 transition-all hover:transition-shadow hover:ring-2 cursor-pointer'
                                )}
                            >
                                <div className="flex flex-row items-center">
                                    {page.icon && (
                                        <page.icon
                                            className={`h-5 w-5 mr-3 ${
                                                activePage === page.id ? 'text-indigo-500' : 'text-gray-400 dark:text-gray-500'
                                            }`}
                                        />
                                    )}
                                    <Text>{page.title}</Text>

                                    {/* Badge if provided */}
                                    {page.badge && (
                                        <Text
                                            size="xs"
                                            className="ml-auto rounded-full bg-amber-100 px-2.5 py-0.5 font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                        >
                                            {page.badge}
                                        </Text>
                                    )}
                                </div>

                                {/* Description if provided */}
                                <Activity
                                    mode={page.description && typeof page.description !== 'string' ? 'visible' : 'hidden'}>
                                    <div className="mt-1 mb-3 ml-8">{page.description}</div>
                                </Activity>

                                <Activity
                                    mode={page.description && typeof page.description === 'string' && page.description.length > 0 ? 'visible' : 'hidden'}>
                                    <Text size="xs" className="mt-1 ml-8" alt>
                                        {page.description}
                                    </Text>
                                </Activity>
                            </li>
                        )
                    })}
                </ul>
            </nav>

            {/* Footer */}
            {footer && <div className="p-4 border-t border-gray-200 dark:border-zinc-800">{footer}</div>}
        </div>
    )

    return (
        <div
            className={clsx(
                'flex flex-col sm:flex-row h-[750px] w-[1100px] max-w-screen max-h-screen overflow-hidden rounded-xl shadow-2xl bg-neutral-100 dark:bg-neutral-900',
                className
            )}
        >
            {/* Mobile Menu Toggle Button */}
            <button
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="sm:hidden fixed top-6 left-6 z-50 p-1 rounded-lg shadow-lg border"
            >
                {isMobileSidebarOpen ? (
                    <XMarkIcon className="h-5 w-5"/>
                ) : (
                    <Bars3Icon className="h-5 w-5"/>
                )}
            </button>

            {/* Desktop Sidebar */}
            <div className="hidden sm:block bg-new-card shrink-0 border-r w-[25%]">
                <SidebarContent/>
            </div>

            {/* Mobile Sidebar with Animation */}
            <AnimatePresence>
                {isMobileSidebarOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            exit={{opacity: 0}}
                            transition={{duration: 0.2}}
                            onClick={() => setIsMobileSidebarOpen(false)}
                            className="sm:hidden fixed inset-0 bg-black/50 z-30"
                        />

                        {/* Sidebar */}
                        <motion.div
                            initial={{x: '-100%'}}
                            animate={{x: 0}}
                            exit={{x: '-100%'}}
                            transition={{
                                type: 'spring',
                                bounce: 0.1,
                                duration: 0.3
                            }}
                            className="sm:hidden fixed left-0 top-0 bottom-0 w-[80%] max-w-[300px] pt-12 bg-card border-r z-40 shadow-2xl"
                        >
                            <SidebarContent/>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto">
                <div className="h-full">{children}</div>
            </div>
        </div>
    )
}

PagedModal.Page = Page
PagedModal.Body = PageBody

export default PagedModal
