import React, { ReactNode, useEffect } from 'react'
import { PagedModalProvider, usePagedModal } from './context'
import clsx from 'clsx'
import { Text } from '@/components/shared/text'

export interface PageProps {
    id?: string
    title: string
    description?: string | React.ReactNode
    icon?: React.ElementType
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
const Page: React.FC<PageProps> = ({ id: providedId, title, description, icon: Icon, badge, children }) => {
    const { registerPage, activePage } = usePagedModal()
    const id = providedId || title.toLowerCase().replace(/\s+/g, '-')

    useEffect(() => {
        registerPage(id, { title, description, icon: Icon, badge })
    }, [id, title, description, Icon, badge, registerPage])

    if (activePage !== id) return null

    return <>{children}</>
}

const PageBody: React.FC<{ children: ReactNode }> = ({ children }) => {
    return <div className="h-full overflow-y-auto p-6">{children}</div>
}

// The main PagedModal component
const PagedModal: React.FC<PagedModalProps> & { Page: typeof Page; Body: typeof PageBody } = ({ children, className, header, footer }) => {
    return (
        <PagedModalProvider>
            <PagedModalContent className={className} header={header} footer={footer}>
                {children}
            </PagedModalContent>
        </PagedModalProvider>
    )
}

// The internal content component that uses the context
const PagedModalContent: React.FC<PagedModalProps> = ({ children, className, header, footer }) => {
    const { activePage, setActivePage, pages } = usePagedModal()

    return (
        <div
            className={clsx(
                'flex flex-col sm:flex-row h-[750px] max-h-[85vh] w-[1100px] max-w-[95vw] overflow-hidden rounded-xl bg-card shadow-2xl',
                className
            )}
        >
            {/* Sidebar */}
            <div className="hidden sm:block flex-shrink-0 border-r w-[25%] bg-sidebar">
                <div className="flex flex-col h-full">
                    {/* Header */}
                    {header && <div className="p-4 border-b">{header}</div>}

                    {/* Navigation */}
                    <nav className="flex-1 p-4 overflow-y-auto">
                        <ul className="space-y-2">
                            {Object.values(pages).map(page => {
                                const PageIcon = page.icon
                                return (
                                    <li
                                        key={page.id}
                                        onClick={() => setActivePage(page.id)}
                                        className={clsx(
                                            activePage === page.id ? 'bg-n-2/25 dark:bg-n-6/50' : 'hover:bg-n-2/25 dark:hover:bg-n-6/50',
                                            'ring-default/25 ring-default group w-full items-center justify-start gap-4 rounded px-4 py-3 transition-all hover:ring-2'
                                        )}
                                    >
                                        <div onClick={() => setActivePage(page.id)} className="flex flex-row items-center">
                                            {PageIcon && (
                                                <PageIcon
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
                                        {page.description && typeof page.description !== 'string' && (
                                            <div className="mt-1 mb-3 ml-8">{page.description}</div>
                                        )}

                                        {page.description && typeof page.description === 'string' && page.description.length > 0 && (
                                            <Text size="xs" className="mt-1 ml-8 text-alt">
                                                {page.description}
                                            </Text>
                                        )}
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
