import {isVisible} from '@/lib'
import {Activity, MouseEvent, useEffect, useMemo, useRef, useState} from 'react'
import {useLocation} from 'wouter'
import {useFileManager} from './context'
import type {FileNode, FileSystemNode} from './types'

type Point = { x: number, y: number }
type Rect = { x: number, y: number, w: number, h: number }

function rectFromPoints(a: Point, b: Point): Rect {
    const x = Math.min(a.x, b.x)
    const y = Math.min(a.y, b.y)
    const w = Math.abs(a.x - b.x)
    const h = Math.abs(a.y - b.y)
    return {x, y, w, h}
}

function intersects(a: DOMRect, r: Rect): boolean {
    const b = {x: a.left, y: a.top, w: a.width, h: a.height}
    return !(b.x > r.x + r.w || b.x + b.w < r.x || b.y > r.y + r.h || b.y + b.h < r.y)
}

export function FileManagerFiles() {
    const {
        baseHref,
        currentPath,
        items,
        loading,
        selectedIds,
        setSelectedIds,
        onOpenFile,
    } = useFileManager()
    const [, navigate] = useLocation()

    const containerRef = useRef<HTMLDivElement | null>(null)
    const containerBoundsRef = useRef<DOMRect | null>(null)
    const dragStart = useRef<Point | null>(null)
    const [dragRect, setDragRect] = useState<Rect | null>(null)
    const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map())

    useEffect(() => {
        itemRefs.current.clear()
    }, [items])

    const visibleItems = useMemo(() => items, [items])

    const handleItemClick = (e: MouseEvent, id: string) => {
        e.preventDefault()
        const isMeta = e.metaKey || e.ctrlKey
        const isShift = e.shiftKey
        setSelectedIds((prev: Set<string>) => {
            const next = new Set(prev)
            if (isMeta) {
                if (next.has(id)) {
                    next.delete(id)
                } else {
                    next.add(id)
                }
            } else if (isShift) {
                // Range select in visible items order
                const ids = visibleItems.map(i => i.id)
                const last = ids.findIndex(x => next.has(x))
                const cur = ids.indexOf(id)
                if (last !== -1 && cur !== -1) {
                    const [a, b] = [Math.min(last, cur), Math.max(last, cur)]
                    for (let i = a; i <= b; i++) next.add(ids[i])
                } else {
                    next.clear()
                    next.add(id)
                }
            } else {
                next.clear()
                next.add(id)
            }
            return next
        })
    }

    const handleItemDoubleClick = (node: FileSystemNode) => {
        if (node.kind === 'folder') {
            const nextHref = `${baseHref}${node.path === '/' ? '' : node.path}`
            navigate(nextHref)
        } else {
            onOpenFile?.(node as FileNode)
        }
    }

    const onMouseDown = (e: MouseEvent) => {
        if (e.button !== 0) return
        // Ignore drags that start on an interactive item
        if ((e.target as HTMLElement).closest('[data-fm-item]')) return
        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return
        containerBoundsRef.current = rect
        dragStart.current = {x: e.clientX, y: e.clientY}
        setDragRect({x: e.clientX, y: e.clientY, w: 0, h: 0})
        setSelectedIds(new Set())
    }

    const onMouseMove = (e: MouseEvent) => {
        if (!dragStart.current) return
        const cur = {x: e.clientX, y: e.clientY}
        const r = rectFromPoints(dragStart.current, cur)
        setDragRect(r)
        // Hit-test each item
        const next = new Set<string>()
        for (const [id, el] of itemRefs.current.entries()) {
            const box = el.getBoundingClientRect()
            if (intersects(box, r)) next.add(id)
        }
        setSelectedIds(next)
    }

    const onMouseUp = () => {
        dragStart.current = null
        setDragRect(null)
    }

    return (
        <div
            ref={containerRef}
            className="flex-1 relative overflow-auto"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseUp}
            onMouseUp={onMouseUp}
        >
            <Activity mode={isVisible(loading)}>
                <div className="p-4 text-sm text-muted-foreground">Loading files…</div>
            </Activity>

            <Activity mode={isVisible(!loading)}>
                <div className="p-3 grid gap-2 grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
                    {visibleItems.map(node => (
                        <div
                            key={node.id}
                            ref={el => {
                                if (el) itemRefs.current.set(node.id, el)
                                else itemRefs.current.delete(node.id)
                            }}
                            data-fm-item
                            className={
                                `group relative rounded border bg-card p-2 cursor-default hover:ring-1 hover:ring-ring ${
                                    selectedIds.has(node.id) ? 'ring-2 ring-primary border-primary' : 'border-border'
                                }`
                            }
                            onClick={e => handleItemClick(e, node.id)}
                            onDoubleClick={() => handleItemDoubleClick(node)}
                            title={node.name}
                        >
                            <div className="aspect-video rounded bg-muted grid place-items-center">
                                <span className="text-xs text-muted-foreground">
                                    {node.kind === 'folder' ? 'Folder' : 'File'}
                                </span>
                            </div>
                            <div className="mt-2 truncate text-xs text-default">{node.name}</div>
                        </div>
                    ))}
                </div>
            </Activity>

            <Activity mode={isVisible(!!dragRect)}>
                {dragRect && (
                    <div
                        className="pointer-events-none absolute border-2 border-primary/50 bg-primary/10"
                        style={{
                            left: (dragRect.x - (containerBoundsRef.current?.left || 0)) + 'px',
                            top: (dragRect.y - (containerBoundsRef.current?.top || 0)) + 'px',
                            width: dragRect.w + 'px',
                            height: dragRect.h + 'px',
                        }}
                    />
                )}
            </Activity>
        </div>
    )
}


