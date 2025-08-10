import React, { createContext, ReactNode, useContext, useState } from 'react'

type PagedModalContextType = {
    activePage: string
    setActivePage: (id: string) => void
    pages: Record<
        string,
        {
            id: string
            title: string
            description?: ReactNode | string
            icon?: React.ElementType
            badge?: string
        }
    >
    registerPage: (
        id: string,
        pageInfo: {
            title: string
            description?: ReactNode | string
            icon?: React.ElementType
            badge?: string
        }
    ) => void
}

const PagedModalContext = createContext<PagedModalContextType | undefined>(undefined)

export const PagedModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activePage, setActivePage] = useState<string>('')
    const [pages, setPages] = useState<
        Record<
            string,
            {
                id: string
                title: string
                description?: ReactNode | string
                icon?: React.ElementType
                badge?: string
            }
        >
    >({})

    const registerPage = (
        id: string,
        pageInfo: {
            title: string
            description?: ReactNode | string
            icon?: React.ElementType
            badge?: string
        }
    ) => {
        setPages(prev => {
            // If this is the first page being registered and no active page is set,
            // automatically set it as the active page
            if (Object.keys(prev).length === 0 && activePage === '') {
                setActivePage(id)
            }

            return {
                ...prev,
                [id]: {
                    id,
                    ...pageInfo,
                },
            }
        })
    }

    return <PagedModalContext.Provider value={{ activePage, setActivePage, pages, registerPage }}>{children}</PagedModalContext.Provider>
}

export const usePagedModal = () => {
    const context = useContext(PagedModalContext)
    if (context === undefined) {
        throw new Error('usePagedModal must be used within a PagedModalProvider')
    }
    return context
}
