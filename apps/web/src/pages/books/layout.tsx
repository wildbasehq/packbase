import {createContext, ReactNode, useContext, useEffect, useMemo, useState} from 'react'

type BooksSidebarContextValue = {
    sidebar: ReactNode
    setSidebar: (node: ReactNode) => void
}

const BooksSidebarContext = createContext<BooksSidebarContextValue | null>(null)

export function useBooksSidebar() {
    const ctx = useContext(BooksSidebarContext)
    if (!ctx) {
        throw new Error('useBooksSidebar must be used within BooksLayout')
    }
    return ctx
}

export function BookSidebarPortal({children}: { children: ReactNode }) {
    const {setSidebar} = useBooksSidebar()

    useEffect(() => {
        setSidebar(children)
        return () => setSidebar(null)
    }, [children, setSidebar])

    return null
}

export default function BooksLayout({children}: { children: ReactNode }) {
    const [sidebar, setSidebar] = useState<ReactNode>(null)
    const value = useMemo(() => ({sidebar, setSidebar}), [sidebar])

    return (
        <BooksSidebarContext.Provider value={value}>
            <div className="h-full flex">
                <div className="h-full w-80 shrink-0 border-r border-border flex flex-col bg-sidebar">
                    {sidebar ?? 'Portal To Here'}
                </div>

                {children}
            </div>
        </BooksSidebarContext.Provider>
    )
}
