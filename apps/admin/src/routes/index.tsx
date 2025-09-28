import { Button, ErrorBoundary, InlineLoading } from '@carbon/react'
import { useEffect, useState } from 'react'
import { ErrorEmptyState } from '@carbon/ibm-products'
import { Link, useLocation } from 'wouter'
import { listQueryPages } from '@/lib/queryPages'

function QueryPageList() {
    const [isLoading, setIsLoading] = useState(true)
    const [pages, setPages] = useState<Awaited<ReturnType<typeof listQueryPages>>>([])
    const [, navigate] = useLocation()

    useEffect(() => {
        void load()
        async function load() {
            setIsLoading(true)
            try {
                const data = await listQueryPages()
                setPages(data)
            } finally {
                setIsLoading(false)
            }
        }
    }, [])

    return (
        <div className="!p-6">
            <div className="!mb-4 !flex items-center justify-between">
                <div>
                    <h2>Hi there!</h2>
                    <p>These are the pages available to you.</p>
                </div>
                <Button onClick={() => navigate('~/query/new')}>Create</Button>
            </div>

            {isLoading ? (
                <InlineLoading description="Loading" />
            ) : pages.length ? (
                <div className="grid gap-3">
                    {pages.map(p => (
                        <Link key={p.id} href={`/query/${p.slug}`}>
                            <a
                                className="block !no-underline"
                                style={{ border: '1px solid var(--cds-border-subtle-01)', borderRadius: 6, padding: 12 }}
                            >
                                <div className="!font-semibold">{p.title}</div>
                                {!!p.description && <div className="!text-text-secondary">{p.description}</div>}
                            </a>
                        </Link>
                    ))}
                </div>
            ) : (
                <div>No pages yet.</div>
            )}
        </div>
    )
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
            <QueryPageList />
        </ErrorBoundary>
    )
}
