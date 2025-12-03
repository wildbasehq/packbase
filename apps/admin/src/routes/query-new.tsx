import React, {useEffect, useMemo, useState} from 'react'
import {Button, Column, FlexGrid, InlineLoading, InlineNotification, Layer, Row, Stack, TextInput} from '@carbon/react'
import {OptionsTile} from '@carbon/ibm-products'
import SqlEditor from '@/components/SqlEditor'
import TableLayoutEditor from '@/components/TableLayoutEditor'
import CarbonDataTable, {Column as DataCol} from '@/components/CarbonDataTable'
import adminSql from '@/lib/adminSql'
import {QueryColumn, QueryPage, upsertQueryPage, UpsertQueryPageInput} from '@/lib/queryPages'
import {useLocation} from 'wouter'
import {evaluateCustomContent} from '@/lib/customContent'
import {similarity} from "wominjeka/src/utils/similarity";

type PreviewRow = Record<string, any>

export function QueryEditor(props: { page?: QueryPage; onSaved?: (page: QueryPage) => void }) {
    const page = props.page
    const isEditing = !!page
    const [title, setTitle] = useState(page?.title || '')
    const [slug, setSlug] = useState(page?.slug || '')
    const [description, setDescription] = useState(page?.description || '')
    const [sql, setSql] = useState(page?.sql || "SELECT 1 as id, 'example' as name")
    const [mapping, setMapping] = useState<QueryColumn[]>(
        page?.mapping || [
            {key: 'id', header: 'ID'},
            {key: 'name', header: 'Name'},
        ]
    )
    const [previewRows, setPreviewRows] = useState<PreviewRow[]>([])
    // Optional batch delete support
    const [deleteKey, setDeleteKey] = useState<string>(page?.delete_key || '')
    const [deleteSql, setDeleteSql] = useState<string>(page?.delete_sql || '')
    const [customJs, setCustomJs] = useState<string>(page?.custom_js || '')
    const [isRunning, setIsRunning] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [availableKeys, setAvailableKeys] = useState<string[]>([])
    const [, navigate] = useLocation()

    useEffect(() => {
        if (!deleteSql || deleteSql.trim().length === 0) return

        const newDeleteSql = `DELETE
                              FROM ${page?.slug || 'posts'}
                              WHERE ${deleteKey} = ANY ($1::uuid[])`
        setDeleteSql(prev => {
            if (!prev) return newDeleteSql
            // Are these 2 similar (by ~95% similarity)? If so, do the update
            if (similarity(prev, newDeleteSql) > 0.8) return newDeleteSql
            return prev
        })
    }, [deleteKey, deleteSql, page?.slug])

    useEffect(() => {
        if (isEditing) return
        const s = title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
        if (!slug || slug.startsWith(s.slice(0, slug.length))) setSlug(s)
    }, [title, slug, isEditing])

    async function runPreview() {
        setIsRunning(true)
        try {
            const res = await adminSql({query: sql})
            if (res.ok && res.type === 'query') {
                const rows = (res.rows as any[]).map((r, idx) => ({id: String(idx + 1), ...r}))
                setPreviewRows(rows)
                const keys = rows.length ? Object.keys(rows[0]).filter(k => k !== 'id') : []
                setAvailableKeys(keys)
            } else {
                alert('SQL error: ' + (!res.ok ? (res as any).error : 'Unexpected execute result'))
            }
        } finally {
            setIsRunning(false)
        }
    }

    const tableColumns: ReadonlyArray<DataCol<PreviewRow>> = useMemo(() => {
        return mapping.map(m => ({header: m.header, key: m.key as any}))
    }, [mapping])

    const [customPreview, setCustomPreview] = useState<{
        element?: React.ReactNode;
        html?: string;
        error?: string
    } | null>(null)
    const [isRenderingPreview, setIsRenderingPreview] = useState(false)

    useEffect(() => {
        let cancelled = false

        async function run() {
            if (!customJs?.trim() || !previewRows.length) {
                setCustomPreview(null)
                setIsRenderingPreview(false)
                return
            }
            setIsRenderingPreview(true)
            const res = await evaluateCustomContent(customJs, previewRows)
            if (!cancelled) {
                setCustomPreview(res)
                setIsRenderingPreview(false)
            }
        }

        void run()
        return () => {
            cancelled = true
        }
    }, [customJs, previewRows])

    async function onSave() {
        if (!title || !slug || !sql || !mapping.length) {
            alert('Please fill in title, slug, SQL, and at least one column mapping.')
            return
        }
        setIsSaving(true)
        try {
            const input: UpsertQueryPageInput = {
                id: page?.id,
                slug,
                title,
                description,
                sql,
                mapping,
                custom_js: customJs,
                ...(deleteKey && deleteSql ? {delete_key: deleteKey, delete_sql: deleteSql} : {}),
            }
            const saved = await upsertQueryPage(input)
            navigate(`~/query/${saved.slug}`)
            props.onSaved?.(saved)
        } catch (e: any) {
            alert('Failed to save: ' + (e?.message || String(e)))
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="!px-6 !py-4">
            <FlexGrid>
                <Row>
                    <Column lg={12}>
                        <Stack gap={6}>
                            <OptionsTile
                                className="example-class"
                                invalidText="You must fill in title and slug."
                                lockedText="This page is managed by your administrator"
                                size="xl"
                                invalid={!title || !slug}
                                summary={`${title ? `Title: ${title}` : 'Untitled'}${slug ? ` | Slug: ${slug}` : 'untitled'}${description ? ` | Description: ${description}` : ''}`}
                                title="Page"
                            >
                                <TextInput
                                    id="title"
                                    labelText="Page title"
                                    value={title}
                                    onChange={e => setTitle(e.currentTarget.value)}
                                    placeholder="e.g. Active Users"
                                />
                                <TextInput
                                    id="slug"
                                    labelText="Slug"
                                    value={slug}
                                    onChange={e => setSlug(e.currentTarget.value)}
                                    placeholder="e.g. active-users"
                                />
                                <TextInput
                                    id="description"
                                    labelText="Description"
                                    value={description}
                                    onChange={e => setDescription(e.currentTarget.value)}
                                    placeholder="Optional"
                                />
                            </OptionsTile>
                            <OptionsTile
                                className="!mt-4"
                                invalidText="Both delete key and delete SQL must be filled in, or both must be empty."
                                invalid={!!(deleteKey || deleteSql) && (!deleteKey || !deleteSql)}
                                size="xl"
                                summary={
                                    !deleteKey || !deleteSql
                                        ? "Moderators won't be able to delete rows."
                                        : `When moderators delete rows, the "${deleteKey || 'id'}" column will be used to delete the rows. The SQL to delete the rows is: ${deleteSql || ''}`
                                }
                                title="Batch Delete (optional)"
                            >
                                <div style={{fontWeight: 600, marginBottom: 8}}>Batch Delete (optional)</div>
                                <div className="grid lg:grid-cols-3 gap-4">
                                    <TextInput
                                        id="deleteKey"
                                        labelText="Delete key (column in results)"
                                        placeholder="e.g. id"
                                        value={deleteKey}
                                        onChange={e => setDeleteKey(e.currentTarget.value)}
                                        list="available-keys"
                                    />
                                    <TextInput
                                        id="deleteSql"
                                        labelText="Delete SQL (use $1 as array param)"
                                        placeholder="e.g. DELETE FROM posts WHERE id = ANY($1::uuid[])"
                                        value={deleteSql}
                                        onChange={e => setDeleteSql(e.currentTarget.value)}
                                    />
                                </div>
                            </OptionsTile>

                            <OptionsTile
                                className="!mt-4"
                                size="xl"
                                summary={
                                    customJs?.trim()
                                        ? 'Custom content will render above the table.'
                                        : 'No custom content. The table will render alone.'
                                }
                                title="Custom Content (optional)"
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: 8
                                }}>
                                    <div style={{fontWeight: 600}}>Custom JavaScript (default export)</div>
                                    <div style={{color: 'var(--cds-text-secondary)'}}>Receives: rows (SQL result)</div>
                                </div>
                                <SqlEditor value={customJs} onChange={setCustomJs} language="javascript" height={260}/>
                                <div className="!mt-4">
                                    <div style={{fontWeight: 600, marginBottom: 8}}>Custom Content Preview</div>
                                    {!previewRows.length && (
                                        <InlineNotification
                                            title="Run SQL preview to render custom content"
                                            subtitle="Click Run preview above to fetch rows, then content will render here."
                                            kind="info"
                                            hideCloseButton
                                        />
                                    )}
                                    {!!previewRows.length && customJs?.trim() && (
                                        <Layer>
                                            {isRenderingPreview ? (
                                                <InlineLoading description="Rendering"/>
                                            ) : customPreview?.error ? (
                                                <InlineNotification
                                                    title="Custom content error"
                                                    subtitle={customPreview.error}
                                                    kind="error"
                                                    hideCloseButton
                                                />
                                            ) : customPreview?.element ? (
                                                <div>{customPreview.element as any}</div>
                                            ) : customPreview?.html ? (
                                                <div dangerouslySetInnerHTML={{__html: customPreview.html}}/>
                                            ) : (
                                                <InlineNotification
                                                    title="Nothing to render"
                                                    subtitle="Return JSX or an HTML string from your function."
                                                    kind="warning"
                                                    hideCloseButton
                                                />
                                            )}
                                        </Layer>
                                    )}
                                </div>
                            </OptionsTile>

                            <div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: 8
                                }}>
                                    <div>
                                        <div style={{fontWeight: 600}}>SQL Editor</div>
                                        <div style={{color: 'var(--cds-text-secondary)'}}>
                                            Moderators using this table cannot change SQL. While the DB only
                                            contains public content, select wisely.
                                        </div>
                                    </div>
                                    <Button kind="secondary" size="sm" onClick={runPreview} disabled={isRunning}>
                                        {isRunning ? <InlineLoading description="Running"/> : 'Run preview'}
                                    </Button>
                                </div>
                                <SqlEditor value={sql} onChange={setSql} language="sql"/>
                            </div>

                            <div>
                                <TableLayoutEditor columns={mapping} onChange={setMapping}
                                                   availableKeys={availableKeys}/>
                            </div>

                            <div>
                                <div style={{fontWeight: 600, marginBottom: 8}}>Table Preview</div>
                                <CarbonDataTable
                                    title="Preview"
                                    rows={previewRows as any}
                                    columns={tableColumns as any}
                                    searchable={true}
                                />
                            </div>

                            <div style={{display: 'flex', gap: 12}}>
                                <Button kind="primary" onClick={onSave} disabled={isSaving}>
                                    {isSaving ? <InlineLoading description="Saving"/> : 'Save'}
                                </Button>
                            </div>
                        </Stack>
                    </Column>
                </Row>
            </FlexGrid>
        </div>
    )
}

export default function RouteQueryNew() {
    return <QueryEditor/>
}
