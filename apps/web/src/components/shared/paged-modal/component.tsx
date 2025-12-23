import {Text} from '@/components/shared/text'
import {cn} from '@/lib'
import clsx from 'clsx'
import {Activity, ElementType, FC, ReactNode, useEffect} from 'react'
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
    return <div className={cn('h-full w-full overflow-y-auto p-6 relative', className)}>{children}</div>
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

    return (
        <div
            className={clsx(
                'flex flex-col sm:flex-row h-[750px] max-h-[85vh] w-[1100px] max-w-[95vw] overflow-hidden rounded-xl bg-card shadow-2xl',
                className
            )}
        >
            {/* Sidebar */}
            <div className="hidden sm:block shrink-0 border-r w-[25%]">
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
                                        onClick={() => setActivePage(page.id)}
                                        className={clsx(
                                            activePage === page.id ? 'bg-muted' : 'hover:bg-muted',
                                            'ring-default group w-full items-center justify-start gap-4 rounded px-4 py-3 transition-all hover:transition-shadow hover:ring-2'
                                        )}
                                    >
                                        <div onClick={() => setActivePage(page.id)}
                                             className="flex flex-row items-center">
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
            </div>

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
