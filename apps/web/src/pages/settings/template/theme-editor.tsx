import React, { useEffect, useRef, useState } from 'react'
import * as monaco from 'monaco-editor'
import { Button } from '@/components/shared/experimental-button-rework.tsx'
import { Alert, AlertDescription, AlertTitle } from '@/components/shared/alert.tsx'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import HTMLMonacoLinter from 'monaco-html-linter'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/20/solid'
import CharmingTabs from '@/components/charm/tabs.tsx'
import { Theme, ThemeAPI } from '@/lib/api/theme'
import ShowLightbulbIconMode = monaco.editor.ShowLightbulbIconMode

// HTML linter configuration
const linterConfig = {
    // Document Rules
    'doctype-first': false, // Doctype must be declared first
    'doctype-html5': true, // Invalid doctype
    'html-lang-require': true, // The lang attribute of the <html> element must be present

    // Head Rules
    'head-script-disabled': true, // The <script> tag cannot be used in a <head> tag
    'script-disabled': true, // <script> tags cannot be used
    'iframe-disabled': true, // <iframe> tags cannot be used
    'title-require': true, // <title> must be present in <head> tag

    // Attribute Rules
    'attr-lowercase': true, // All attribute names must be in lowercase
    'attr-no-duplication': true, // Elements cannot have duplicate attributes
    'attr-no-unnecessary-whitespace': true, // No spaces between attribute names and values
    'attr-unsafe-chars': true, // Attribute values cannot contain unsafe chars
    'attr-value-double-quotes': true, // Attribute values must be in double quotes
    'attr-value-not-empty': true, // All attributes must have values
    'alt-require': true, // The alt attribute of an element must be present and alt attribute of area[href] and input[type=image] must have a value

    // Tags Rules
    'tags-check': true, // Checks html tags
    'tag-pair': true, // Tag must be paired
    'tag-self-close': true, // Empty tags must be self closed
    'tagname-lowercase': true, // All html element names must be in lowercase
    'empty-tag-not-self-closed': false, // Empty tags must not use self-closing syntax
    'src-not-empty': true, // The src attribute of an img(script,link) must have a value
    'href-abs-or-rel': false, // An href attribute must be either absolute or relative

    // ID Rules
    'id-class-ad-disabled': true, // The id and class attributes cannot use the ad keyword
    'id-class-value': false, // The id and class attribute values must meet the specified rules
    'id-unique': true, // The value of id attributes must be unique

    // Inline Rules
    'inline-script-disabled': true, // Inline script cannot be used
    'inline-style-disabled': false, // Inline style cannot be used

    // Style Rules
    'space-tab-mixed-disabled': true, // Do not mix tabs and spaces for indentation
    'spec-char-escape': true, // Special characters must be escaped
}

// Initialize Monaco workers
self.MonacoEnvironment = {
    getWorker(_, label) {
        if (label === 'html') {
            return new htmlWorker()
        }
        if (label === 'css') {
            return new cssWorker()
        }
        return new editorWorker()
    },
}

// Configure HTML language features
monaco.languages.html.htmlDefaults.setModeConfiguration({
    completionItems: true,
    hovers: true,
    diagnostics: true,
    documentSymbols: true,
    links: true,
    rename: true,
    colors: true,
    documentHighlights: true,
    documentFormattingEdits: true,
    foldingRanges: true,
    selectionRanges: true,
    documentRangeFormattingEdits: true,
})

// Create a wrapper component for Monaco
const MonacoEditorWrapper = ({ language, defaultValue, onChange }) => {
    const [isEditorReady, setIsEditorReady] = useState(false)
    const containerRef = useRef(null)
    const editorRef = useRef(null)
    const contentRef = useRef(defaultValue)

    // Initialize editor after container is mounted
    useEffect(() => {
        // Wait for next frame to ensure container is properly mounted
        const timeoutId = setTimeout(() => {
            if (containerRef.current && !editorRef.current) {
                try {
                    editorRef.current = monaco.editor.create(containerRef.current, {
                        placeholder: `/* Write your ${language.toUpperCase()} code here! */`,
                        value: defaultValue,
                        language: language,
                        theme: 'vs-dark',
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        roundedSelection: true,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        padding: { top: 16 },
                        formatOnPaste: true,
                        formatOnType: true,
                        wordWrap: 'on',
                        suggest: {
                            snippetsPreventQuickSuggestions: false,
                        },
                        // Enable quick suggestions
                        quickSuggestions: {
                            other: true,
                            comments: true,
                            strings: true,
                        },
                        // Configure validation features
                        lightbulb: {
                            enabled: ShowLightbulbIconMode.On,
                        },
                    })

                    // Set up change handler
                    editorRef.current.onDidChangeModelContent(() => {
                        const value = editorRef.current.getValue()
                        if (value !== contentRef.current) {
                            contentRef.current = value
                            onChange(value)
                        }
                    })

                    // Add HTML linter if it's an HTML editor
                    if (language === 'html') {
                        // @ts-ignore
                        const linter = new HTMLMonacoLinter(editorRef.current, monaco, linterConfig)
                        linter.watch()
                    }

                    // Add format command shortcut
                    editorRef.current.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
                        editorRef.current.getAction('editor.action.formatDocument').run()
                    })

                    setIsEditorReady(true)

                    // Handle window resizing
                    const resizeEditor = () => {
                        if (editorRef.current) {
                            editorRef.current.layout()
                        }
                    }
                    window.addEventListener('resize', resizeEditor)

                    // Cleanup resize listener
                    return () => {
                        window.removeEventListener('resize', resizeEditor)
                    }
                } catch (error) {
                    console.error(`Failed to initialize Monaco editor for ${language}:`, error)
                }
            }
        }, 0)

        return () => {
            clearTimeout(timeoutId)
            if (editorRef.current) {
                editorRef.current.dispose()
                editorRef.current = null
            }
        }
    }, [language])

    // Handle external value updates without losing focus
    useEffect(() => {
        if (editorRef.current && isEditorReady && defaultValue !== contentRef.current) {
            const model = editorRef.current.getModel()
            if (model) {
                // Save current cursor position and selections
                const selections = editorRef.current.getSelections()
                const scrollPosition = editorRef.current.getScrollPosition()

                // Update content
                model.setValue(defaultValue)
                contentRef.current = defaultValue

                // Restore cursor position and selections
                editorRef.current.setSelections(selections)
                editorRef.current.setScrollPosition(scrollPosition)
            }
        }
    }, [defaultValue, isEditorReady])

    return (
        <div
            ref={containerRef}
            className="h-96 w-full rounded-lg border border-slate-700"
            style={{ visibility: isEditorReady ? 'visible' : 'hidden' }}
        />
    )
}

// List of blocked HTML elements for security
const BLOCKED_ELEMENTS = [
    'script', // Prevents JavaScript injection
    'iframe', // Prevents iframe embedding
    'object', // Prevents embedding of external objects
    'embed', // Prevents embedding of external content
    'form', // Prevents form submission
    'input', // Prevents form inputs
    'button', // Prevents button elements
    'link', // Prevents external stylesheet loading
    'meta', // Prevents metadata manipulation
    'video', // Prevents video embedding
    'audio', // Prevents audio embedding
    'canvas', // Prevents canvas manipulation
    'svg', // Prevents SVG (which can contain scripts)
]

// Check for blocked elements in HTML
const checkForBlockedElements = htmlContent => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, 'text/html')

    for (const element of BLOCKED_ELEMENTS) {
        const found = doc.getElementsByTagName(element)
        if (found.length > 0) {
            return `The use of <${element}> tags is reserved for verified developers with high trust.`
        }
    }

    // Check for event handlers
    const allElements = doc.getElementsByTagName('*')
    for (const el of allElements) {
        const attributes = el.attributes
        for (const attr of attributes) {
            if (attr.name.toLowerCase().startsWith('on')) {
                return `Event handlers (like ${attr.name}) are reserved for verified developers with high trust.`
            }
        }
    }

    return null
}

interface ThemeEditorProps {
    theme: Theme
    onSave: (theme: Theme) => Promise<void>
    onCancel: () => void
}

const ThemeEditor: React.FC<ThemeEditorProps> = ({ theme, onSave, onCancel }) => {
    const [showPreview, setShowPreview] = useState(false)
    const [error, setError] = useState('')
    const [activeTabIndex, setActiveTabIndex] = useState(0)
    const [name, setName] = useState(theme.name)
    const [html, setHtml] = useState(theme.html || '')
    const [css, setCss] = useState(theme.css || '')
    const [isActive, setIsActive] = useState(theme.is_active || false)
    const [isSaving, setIsSaving] = useState(false)

    // Refs to track the latest values of html and css
    const htmlRef = useRef(html)
    const cssRef = useRef(css)

    // Tabs for the editor
    const tabs = [
        { label: 'HTML', value: 'html' },
        { label: 'CSS', value: 'css' },
    ]

    // Debounce validation to prevent too frequent updates
    const validateTimeoutRef = useRef(null)

    // Validate theme content
    const validateTheme = async () => {
        try {
            // First check for blocked elements
            const blockedError = checkForBlockedElements(htmlRef.current)
            if (blockedError) {
                setError(blockedError)
                return false
            }

            // Validate with the API
            const result = await ThemeAPI.validate(htmlRef.current, cssRef.current)

            if (result && !result.isValid) {
                setError(result.htmlIssue || result.cssIssue || 'Invalid theme content')
                return false
            }

            setError('')
            return true
        } catch (e) {
            setError('Failed to validate theme content')
            return false
        }
    }

    // Handle HTML editor changes
    const handleHtmlChange = newValue => {
        setHtml(newValue)
        htmlRef.current = newValue

        // Debounce validation
        if (validateTimeoutRef.current) {
            clearTimeout(validateTimeoutRef.current)
        }
        validateTimeoutRef.current = setTimeout(() => {
            validateTheme()
        }, 500)
    }

    // Handle CSS editor changes
    const handleCssChange = newValue => {
        setCss(newValue)
        cssRef.current = newValue

        // Debounce validation
        if (validateTimeoutRef.current) {
            clearTimeout(validateTimeoutRef.current)
        }
        validateTimeoutRef.current = setTimeout(() => {
            validateTheme()
        }, 500)
    }

    // Handle save
    const handleSave = async () => {
        if (await validateTheme()) {
            setIsSaving(true)
            try {
                await onSave({
                    ...theme,
                    name,
                    html: htmlRef.current,
                    css: cssRef.current,
                    is_active: isActive,
                })
            } catch (error) {
                console.error('Error saving theme:', error)
                setError('Failed to save theme')
            } finally {
                setIsSaving(false)
            }
        }
    }

    // Update refs when state changes from props
    useEffect(() => {
        htmlRef.current = theme.html || ''
        cssRef.current = theme.css || ''
    }, [theme])

    // Cleanup validation timeout
    useEffect(() => {
        return () => {
            if (validateTimeoutRef.current) {
                clearTimeout(validateTimeoutRef.current)
            }
        }
    }, [])

    // Combined CSS for preview
    const combinedPreview = `
        <style>${cssRef.current}</style>
        ${htmlRef.current}
    `

    return (
        <div className="space-y-4 h-full flex flex-col">
            {/* Theme name and active status */}
            <div className="flex items-center gap-4">
                <div className="flex-1">
                    <label htmlFor="theme-name" className="block text-sm font-medium mb-1">
                        Theme Name
                    </label>
                    <input
                        id="theme-name"
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-zinc-800 dark:border-zinc-700"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <input
                        id="is-active"
                        type="checkbox"
                        checked={isActive}
                        onChange={e => setIsActive(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is-active" className="text-sm font-medium">
                        Set as active theme
                    </label>
                </div>
            </div>

            {/* Editor Controls */}
            <div className="flex justify-between items-center">
                <Button outline onClick={() => setShowPreview(!showPreview)}>
                    {showPreview ? <EyeIcon className="mr-2 inline-flex" /> : <EyeSlashIcon className="mr-2 inline-flex" />}
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                </Button>

                <div className="text-sm text-alt">
                    {error ? (
                        <span className="flex items-center text-tertiary">
                            <XCircleIcon className="mr-1 h-4 w-4 inline-flex" />
                            Can't upload this code
                        </span>
                    ) : (
                        <span className="flex items-center text-green-500">
                            <CheckCircleIcon className="mr-1 h-4 w-4 inline-flex" />
                            Allowed
                        </span>
                    )}
                </div>

                <div className="flex gap-2">
                    <Button outline onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={!!error || isSaving}>
                        <CheckCircleIcon className="mr-2 inline-flex" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    {error.split('\n').map((line, index) => {
                        if (index === 0) {
                            return <AlertTitle key={index}>{line}</AlertTitle>
                        }
                        return <AlertDescription key={index}>{line}</AlertDescription>
                    })}
                </Alert>
            )}

            {/* Tabs and Editor */}
            <div className="flex-1 flex flex-col">
                <CharmingTabs items={tabs} selectedIndex={activeTabIndex} onChange={setActiveTabIndex} />

                <div className="mt-4 flex-1">
                    {activeTabIndex === 0 && <MonacoEditorWrapper language="html" defaultValue={html} onChange={handleHtmlChange} />}
                    {activeTabIndex === 1 && <MonacoEditorWrapper language="css" defaultValue={css} onChange={handleCssChange} />}
                </div>
            </div>

            {/* Preview Panel */}
            {showPreview && (
                <div className="preview-container mt-4 p-4 border border-gray-300 rounded-lg dark:border-zinc-700">
                    <h3 className="text-sm font-medium mb-2">Preview</h3>
                    <div className="bg-white dark:bg-zinc-800 p-4 rounded" dangerouslySetInnerHTML={{ __html: combinedPreview }} />
                </div>
            )}
        </div>
    )
}

export default ThemeEditor
