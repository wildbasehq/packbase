import React from 'react'
import Editor from '@monaco-editor/react'
import { Layer } from '@carbon/react'

export type SqlEditorProps = {
    value: string
    onChange: (value: string) => void
    height?: number | string
    language?: string
}

export default function SqlEditor(props: SqlEditorProps) {
    const { value, onChange, height = 260, language = 'sql' } = props
    return (
        <Layer>
            <div style={{ border: '1px solid var(--cds-border-subtle-01)', borderRadius: 4, overflow: 'hidden' }}>
                <Editor
                    height={height}
                    defaultLanguage={language}
                    language={language}
                    theme="vs-dark"
                    value={value}
                    onChange={v => onChange(v || '')}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        wordWrap: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                    }}
                />
            </div>
        </Layer>
    )
}
