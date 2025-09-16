import { AILabel, AILabelContent, ErrorBoundary } from '@carbon/react'
import adminSql from '@/lib/adminSql'
import { useEffect, useMemo, useState } from 'react'
import { Download, Save, TrashCan } from '@carbon/icons-react'
import CarbonDataTable, { BatchAction, Column } from '@/components/CarbonDataTable'
import { rowsToCsv, saveCsv } from '@/components/csv'
import { ErrorEmptyState } from '@carbon/ibm-products'

interface PostType {
    body: string
    content_type: string
    id: string
    tenant_id: string
    user_id: string
    rheo_classification: string
    created_at: string
    classification: {
        label: string
        rheoAgrees: boolean
    }
}

function PostTable() {
    const [postList, setPostList] = useState<PostType[]>()

    useEffect(() => {
        adminSql({ query: 'SELECT * FROM posts' })
            .then(sql => {
                if (sql.ok && sql.type === 'query') {
                    setPostList(
                        (sql.rows as PostType[]).map(post => ({
                            ...post,
                            rheo_classification: `${post.classification?.label?.split(' ')[0] || 'RHEO_CANNOT_CLASSIFY'}`,
                        })) || []
                    )
                }
            })
            .catch(error => {
                throw new Error(error)
            })
    }, [])

    const columns: ReadonlyArray<Column<PostType>> = useMemo(
        () => [
            { header: 'ID', key: 'id' },
            { header: 'Content Type', key: 'content_type' },
            { header: 'Body', key: 'body' },
            { header: 'User ID', key: 'user_id' },
            { header: 'Tenant ID', key: 'tenant_id' },
            {
                header: 'Classification',
                key: 'rheo_classification',
                decorator: (
                    <AILabel align="bottom" className="ai-label-container">
                        <AILabelContent>
                            <div>
                                <p className="secondary">AI Explained</p>
                                <h2 className="ai-label-heading">600</h2>
                                <p className="secondary !font-bold">Samples Trained</p>
                                <p className="secondary">
                                    Rheo is currently learning to classify text. Accuracy is expected to improve over time.
                                </p>
                                <hr />
                                <p className="secondary">Model Type</p>
                                <p className="bold">rheo-classify-xxs-001</p>
                            </div>
                        </AILabelContent>
                    </AILabel>
                ),
            },
            { header: 'Created At', key: 'created_at' },
        ],
        []
    )

    const actions: ReadonlyArray<BatchAction<PostType>> = useMemo(
        () => [
            {
                id: 'delete',
                label: 'Delete',
                icon: TrashCan,
                onClick: selected => {
                    const ids = selected.map(r => r.id)
                    adminSql({ query: 'DELETE FROM posts WHERE id = ANY($1::uuid[])', params: [ids] }).then(sql => {
                        if (sql.ok && sql.type === 'execute') {
                            alert('Deleted ' + sql.affected + ' posts')
                            setPostList((postList || []).filter(post => !ids.includes(post.id)))
                        }
                    })
                },
            },
            {
                id: 'download',
                label: 'Download',
                icon: Download,
                onClick: selected => {
                    if (!selected.length) {
                        alert('No rows selected')
                        return
                    }
                    const csv = rowsToCsv(selected, columns)
                    const date = new Date().toISOString().slice(0, 10)
                    void saveCsv(csv, `posts_${date}.csv`)
                },
            },
        ],
        [columns, postList]
    )

    return <CarbonDataTable<PostType> title="Posts" rows={postList || []} columns={columns} batchActions={actions} />
}

export default function RouteIndex() {
    return (
        <ErrorBoundary
            fallback={
                <ErrorEmptyState
                    className="!mx-auto !max-w-fit !h-[calc(100vh-5rem)] !flex justify-center"
                    action={{
                        onClick: function Bke() {
                            window.location.reload()
                        },
                        text: 'Reload and Try Again',
                    }}
                    headingAs="h3"
                    illustrationDescription="Test alt text"
                    illustrationTheme="dark"
                    subtitle="An unexpected error occurred while trying to render or grab SQL results."
                    title="Table crashed while rendering"
                />
            }
        >
            <PostTable />
        </ErrorBoundary>
    )
}
