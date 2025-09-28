import React, { useEffect, useMemo, useState } from 'react'
import { InlineLoading } from '@carbon/react'
import CarbonDataTable, { BatchAction, Column as DataCol } from '@/components/CarbonDataTable'
import { QueryPage, getQueryPageBySlug } from '@/lib/queryPages'
import adminSql from '@/lib/adminSql'
import { useParams } from 'wouter'
import { rowsToCsv, saveCsv } from '@/components/csv'
import { QueryEditor } from '@/routes/query-new'
import { PageHeader } from '@carbon/ibm-products'
import { evaluateCustomContent } from '@/lib/customContent'

type RowType = Record<string, any> & { id: string }

export default function RouteQueryView() {
    const params = useParams<{ slug: string }>()
    const slug = params?.slug || ''
    const [page, setPage] = useState<QueryPage | null>(null)
    const [rows, setRows] = useState<RowType[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isReloading, setIsReloading] = useState(false)
    const [isEditing, setIsEditing] = useState(false)

    useEffect(() => {
        void loadAll()
        async function loadAll() {
            setIsLoading(true)
            try {
                const p = await getQueryPageBySlug(slug)
                setPage(p)
                if (p) {
                    await reload(p.sql)
                }
            } finally {
                setIsLoading(false)
            }
        }
    }, [slug])

    async function reload(sql: string) {
        setIsReloading(true)
        try {
            const res = await adminSql({ query: sql })
            if (res.ok && res.type === 'query') {
                const data = (res.rows as any[]).map((r, idx) => ({ id: String(idx + 1), ...r }))
                setRows(data)
            } else {
                alert('Failed to load rows')
            }
        } finally {
            setIsReloading(false)
        }
    }

    const columns: ReadonlyArray<DataCol<RowType>> = useMemo(() => {
        return (page?.mapping || []).map(m => ({ header: m.header, key: m.key as any }))
    }, [page])

    const [customRender, setCustomRender] = useState<React.ReactNode>(null)

    useEffect(() => {
        let cancelled = false
        async function run() {
            if (!page?.custom_js?.trim()) {
                setCustomRender(null)
                return
            }
            setCustomRender(
                <div className="!p-4">
                    <InlineLoading description="Rendering" />
                </div>
            )
            const res = await evaluateCustomContent(page.custom_js, rows)
            if (cancelled) return
            if (res.error) {
                setCustomRender(
                    <div className="!p-4" style={{ color: 'var(--cds-text-error)' }}>
                        Custom content error: {res.error}
                    </div>
                )
            } else if (res.element) {
                setCustomRender(<div className="!p-4">{res.element as any}</div>)
            } else if (res.html) {
                setCustomRender(<div className="!p-4" dangerouslySetInnerHTML={{ __html: res.html }} />)
            } else {
                setCustomRender(null)
            }
        }
        void run()
        return () => {
            cancelled = true
        }
    }, [page?.custom_js, rows])

    const batchActions: ReadonlyArray<BatchAction<RowType>> = useMemo(() => {
        const actions: BatchAction<RowType>[] = []
        // CSV Export
        actions.push({
            id: 'export',
            label: 'Export CSV',
            onClick: selected => {
                if (!selected.length) {
                    alert('No rows selected')
                    return
                }
                const csv = rowsToCsv(selected, columns as any)
                const date = new Date().toISOString().slice(0, 10)
                void saveCsv(csv, `${page?.slug || 'export'}_${date}.csv`)
            },
        })

        // Batch Delete if configured
        if (page?.delete_key && page?.delete_sql) {
            actions.push({
                id: 'delete',
                label: 'Delete',
                onClick: async selected => {
                    if (!selected.length) {
                        alert('No rows selected')
                        return
                    }
                    const keys = selected.map(r => r[page.delete_key!]).filter(Boolean)
                    if (!keys.length) {
                        alert('Selected rows are missing delete key')
                        return
                    }
                    const confirmDelete = window.confirm(`Delete ${keys.length} rows?`)
                    if (!confirmDelete) return
                    const res = await adminSql({ query: page.delete_sql!, params: [keys] })
                    if (res.ok) {
                        alert(`Deleted ${keys.length} rows`)
                        // Optimistic update: remove from current data set
                        setRows(prev => prev.filter(r => !keys.includes(r[page.delete_key!])))
                    } else {
                        alert('Delete failed: ' + (res as any).error)
                    }
                },
            })
        }

        return actions
    }, [columns, page])

    if (isLoading) return <InlineLoading description="Loading" />
    if (!page) return <div className="!p-6">Page not found</div>

    return (
        <div>
            <PageHeader
                breadcrumbOverflowAriaLabel="Open and close additional breadcrumb item list."
                breadcrumbs={[
                    {
                        href: '/',
                        key: 'Rheo',
                        label: 'Rheo',
                    },
                ]}
                pageActions={[
                    {
                        key: 'refresh',
                        kind: 'secondary',
                        label: isReloading ? 'Refreshing' : 'Refresh',
                        onClick: () => reload(page.sql),
                    },
                    {
                        key: 'edit',
                        kind: 'primary',
                        label: isEditing ? 'Cancel' : 'Edit',
                        onClick: () => setIsEditing(!isEditing),
                    },
                ]}
                pageActionsOverflowLabel="Page actions..."
                title={{
                    icon: undefined,
                    loading: false,
                    text: page.title,
                }}
            >
                {page.description}
            </PageHeader>

            {!isEditing && (
                <>
                    {customRender}
                    <CarbonDataTable<RowType> rows={rows} columns={columns} batchActions={batchActions} />
                </>
            )}
            {isEditing && (
                <QueryEditor
                    page={page}
                    onSaved={updated => {
                        setIsEditing(false)
                        setPage(updated)
                    }}
                />
            )}
        </div>
    )
}
