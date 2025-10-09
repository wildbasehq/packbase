import {useEffect, useMemo, useState} from 'react'
import {Activity} from 'react'
import {isVisible} from '@/lib'
import Link from '@/components/shared/link.tsx'
import {useFileManager} from './context'
import type {FolderNode} from './types'

function TreeNode({node, depth}: { node: FolderNode, depth: number }) {
    const {baseHref, currentPath} = useFileManager()
    const [open, setOpen] = useState<boolean>(false)

    useEffect(() => {
        // Auto-open ancestors for current path
        const normalized = currentPath.endsWith('/') ? currentPath.slice(0, -1) : currentPath
        const isAncestor = normalized === node.path || normalized.startsWith(node.path + '/')
        if (isAncestor) setOpen(true)
    }, [currentPath, node.path])

    const isActive = useMemo(() => {
        const normalized = currentPath.endsWith('/') ? currentPath.slice(0, -1) : currentPath
        return normalized === node.path
    }, [currentPath, node.path])

    return (
        <div>
            <div className="flex items-center">
                <button
                    type="button"
                    className="text-muted-foreground hover:text-default mr-1"
                    onClick={() => setOpen(!open)}
                    aria-label={open ? 'Collapse folder' : 'Expand folder'}
                >
                    <span className="inline-block w-4 text-center">{open ? '▾' : '▸'}</span>
                </button>
                <Link
                    href={`${baseHref}${node.path === '/' ? '' : node.path}`}
                    className={
                        `rounded px-2 py-1 text-sm ${isActive ? 'bg-muted text-default' : 'text-default hover:bg-muted'}`
                    }
                    onClick={() => setOpen(true)}
                >
                    {node.name || 'Root'}
                </Link>
            </div>

            <Activity mode={isVisible(open && !!node.children?.length)}>
                <div className="ml-4 mt-1 space-y-1 border-l pl-3 border-border">
                    {node.children?.filter(c => c.kind === 'folder').map(child => (
                        <TreeNode key={child.id} node={child as FolderNode} depth={depth + 1}/>
                    ))}
                </div>
            </Activity>
        </div>
    )
}

export function FileManagerSidebar() {
    const {tree} = useFileManager()
    const [rootNodes, setRootNodes] = useState<FolderNode[]>([])
    const [loading, setLoading] = useState<boolean>(false)

    useEffect(() => {
        if (!tree) return
        let cancelled = false
        setLoading(true)
        Promise.resolve(tree())
            .then(nodes => {
                if (cancelled) return
                // Ensure root path consistency
                const fixed = nodes.map(n => ({
                    ...n,
                    path: n.path || '/',
                }))
                setRootNodes(fixed)
            })
            .finally(() => !cancelled && setLoading(false))
        return () => {
            cancelled = true
        }
    }, [tree])

    return (
        <div className="w-64 shrink-0 border-r bg-card p-2 overflow-y-auto">
            <Activity mode={isVisible(loading)}>
                <div className="text-xs text-muted-foreground px-2 py-1">Loading folders…</div>
            </Activity>
            <Activity mode={isVisible(!loading && !!rootNodes.length)}>
                <div className="space-y-1">
                    {rootNodes.map(node => (
                        <TreeNode key={node.id} node={node} depth={0}/>
                    ))}
                </div>
            </Activity>
            <Activity mode={isVisible(!loading && rootNodes.length === 0)}>
                <div className="text-xs text-muted-foreground px-2 py-1">No folders</div>
            </Activity>
        </div>
    )
}


