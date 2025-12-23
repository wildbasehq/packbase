import {useEffect, useMemo, useState} from 'react'
import {useLocation} from 'wouter'
import {FileManagerContext} from './context'
import type {FileManagerRootProps, FileSystemNode} from './types'

function normalizePath(pathname: string, baseHref: string) {
    const cleaned = pathname.replace(/\/+$/, '')
    if (!baseHref) return cleaned
    const base = baseHref.endsWith('/') ? baseHref.slice(0, -1) : baseHref
    if (cleaned.startsWith(base)) {
        const rest = cleaned.slice(base.length) || '/'
        return rest.startsWith('/') ? rest : `/${rest}`
    }
    return '/'
}

export function FileManagerRoot({
                                    content,
                                    tree,
                                    onUpload,
                                    onChange,
                                    onOpenFile,
                                    baseHref = '/stuff',
                                    children,
                                }: FileManagerRootProps) {
    const [location] = useLocation()
    const [currentPath, setCurrentPath] = useState<string>('/')
    const [items, setItems] = useState<FileSystemNode[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    const listLoader = useMemo(() => {
        if (typeof content === 'function') return content
        return async () => content
    }, [content])

    const treeLoader = useMemo(() => {
        if (!tree) return undefined
        if (typeof tree === 'function') return tree
        return async () => tree
    }, [tree])

    // Sync currentPath from URL
    useEffect(() => {
        const path = normalizePath(window.location.pathname, baseHref)
        setCurrentPath(path || '/')
    }, [location, baseHref])

    // Load listing when path changes
    useEffect(() => {
        let cancelled = false
        setLoading(true)
        Promise.resolve(listLoader(currentPath))
            .then(result => {
                if (cancelled) return
                setItems(result)
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [currentPath, listLoader])

    // Notify selection changes
    useEffect(() => {
        if (!onChange) return
        if (!items?.length) {
            onChange([])
            return
        }
        const selected = items.filter(node => selectedIds.has(node.id))
        onChange(selected)
    }, [selectedIds, onChange, items])

    const value = useMemo(() => ({
        baseHref,
        currentPath,
        setCurrentPath,
        list: listLoader,
        tree: treeLoader,
        items,
        setItems,
        loading,
        setLoading,
        selectedIds,
        setSelectedIds,
        onUpload,
        onChange,
        onOpenFile,
    }), [
        baseHref,
        currentPath,
        listLoader,
        treeLoader,
        items,
        loading,
        selectedIds,
        onUpload,
        onChange,
        onOpenFile,
    ])

    return (
        <FileManagerContext.Provider value={value}>
            <div className="flex h-full w-full">
                {children}
            </div>
        </FileManagerContext.Provider>
    )
}

export const FileManagerRootMemo = FileManagerRoot


