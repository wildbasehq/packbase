import {lazy, Suspense} from 'react'

const HTMLProfileEditor = lazy(() => import('@/src/pages/settings/template/html-editor.tsx'))
export default function SettingsTemplate() {
    return (
        <div className="p-6">
            <h1>Template</h1>
            <Suspense fallback={<div>Loading...</div>}>
                <HTMLProfileEditor/>
            </Suspense>
        </div>
    )
}