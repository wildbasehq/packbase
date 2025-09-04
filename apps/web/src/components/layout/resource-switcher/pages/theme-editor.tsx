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
import { PackThemeAPI } from '@/lib/api/pack-theme.ts'
import ShowLightbulbIconMode = monaco.editor.ShowLightbulbIconMode
import { Checkbox } from '@/components/shared/input/checkbox.tsx'
import { Label, Tab, TabGroup } from '@headlessui/react'
import { CheckboxField, Tabs } from '@/src/components'
import { Theme, ThemeAPI } from '@/lib/api/theme.ts'

// HTML linter configuration for themes
const linterConfig = {
    // Document Rules
    'doctype-first': false,
    'doctype-html5': true,
    'html-lang-require': false, // More lenient for themes

    // Head Rules
    'head-script-disabled': true,
    'script-disabled': true,
    'iframe-disabled': true,
    'title-require': false, // Themes don't need titles

    // Attribute Rules
    'attr-lowercase': true,
    'attr-no-duplication': true,
    'attr-no-unnecessary-whitespace': true,
    'attr-unsafe-chars': true,
    'attr-value-double-quotes': true,
    'attr-value-not-empty': false, // Allow empty values for some attributes
    'alt-require': false, // More lenient for decorative elements

    // Tags Rules
    'tags-check': true,
    'tag-pair': true,
    'tag-self-close': false,
    'tagname-lowercase': true,
    'empty-tag-not-self-closed': false,
    'src-not-empty': false, // Allow placeholder images

    // ID Rules
    'id-class-ad-disabled': true,
    'id-class-value': false,
    'id-unique': true,

    // Style Rules
    'style-disabled': false, // Allow inline styles for themes
    'inline-style-disabled': false,
    'inline-script-disabled': true,

    // Special Theme Rules
    'space-tab-mixed-disabled': 'tab',
    'spec-char-escape': false,
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
const MonacoEditorWrapper = ({ language, defaultValue, onChange, isUserTheme = false }) => {
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
            className="h-full w-full rounded-lg border border-slate-700"
            style={{ visibility: isEditorReady ? 'visible' : 'hidden' }}
        />
    )
}

interface ThemeEditorProps {
    theme: Theme
    onSave: (theme: Theme) => void
    onCancel: () => void
}

export default function ThemeEditor({ theme, onSave, onCancel }: ThemeEditorProps) {
    const [currentTheme, setCurrentTheme] = useState<Theme>(theme)
    const [isPreviewVisible, setIsPreviewVisible] = useState(true)
    const [validationResult, setValidationResult] = useState<any>(null)
    const [isValidating, setIsValidating] = useState(false)
    const [activeTabIndex, setActiveTabIndex] = useState(0)
    const [error, setError] = useState('')

    // Refs to track the latest values of html and css
    const htmlRef = useRef(currentTheme.html)
    const cssRef = useRef(currentTheme.css)

    // Debounce validation to prevent too frequent updates
    const validateTimeoutRef = useRef(null)

    // Setup Monaco Editor
    useEffect(() => {
        // @ts-ignore
        self.MonacoEnvironment = {
            getWorker: function (_: string, label: string) {
                if (label === 'html') {
                    return new htmlWorker()
                }
                if (label === 'css') {
                    return new cssWorker()
                }
                return new editorWorker()
            },
        }
    }, [])

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

    // Validate theme content
    const validateTheme = async () => {
        try {
            // First check for blocked elements
            const blockedError = checkForBlockedElements(htmlRef.current)
            if (blockedError) {
                setError(blockedError)
                setValidationResult({ valid: false, error: blockedError })
                return false
            }

            // Validate with the API if pack_id exists
            if (currentTheme.pack_id) {
                setIsValidating(true)
                const result = await PackThemeAPI.validate(currentTheme.pack_id, htmlRef.current, cssRef.current)
                setValidationResult(result)

                if (result && !result.valid) {
                    // @ts-ignore
                    setError(result.error || 'Invalid theme content')
                    return false
                }
            }

            if (currentTheme.user_id) {
                setIsValidating(true)
                const result = await ThemeAPI.validate(htmlRef.current, cssRef.current)

                if (result && !result.isValid) {
                    setError(result.htmlIssue || result.cssIssue || 'Invalid theme content')
                    return false
                }
            }

            setError('')
            setValidationResult({ valid: true })
            return true
        } catch (e) {
            console.error('Validation error:', e)
            setError('Failed to validate theme content')
            setValidationResult({ valid: false, error: 'Validation failed' })
            return false
        } finally {
            setIsValidating(false)
        }
    }

    // Handle HTML editor changes
    const handleHtmlChange = newValue => {
        setCurrentTheme(prev => ({ ...prev, html: newValue }))
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
        setCurrentTheme(prev => ({ ...prev, css: newValue }))
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
            onSave({
                ...currentTheme,
                html: htmlRef.current,
                css: cssRef.current,
            })
        }
    }

    // Handle name change
    const handleNameChange = (name: string) => {
        setCurrentTheme(prev => ({ ...prev, name }))
    }

    // Handle active toggle
    const handleActiveToggle = (is_active: boolean) => {
        setCurrentTheme(prev => ({ ...prev, is_active }))
    }

    // Generate preview HTML
    const previewHtml = `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Theme Preview</title>
                <style>
                    body { 
                        margin: 0; 
                        padding: 20px; 
                        font-family: system-ui, -apple-system, sans-serif;
                        background: #f9fafb;
                        color: #374151;
                    }
                    .theme-preview {
                        max-width: 100%;
                        margin: 0 auto;
                    }
                    ${cssRef.current}
                </style>
            </head>
            <body>
                <div class="theme-preview">
                    ${htmlRef.current}
                </div>
            </body>
        </html>
    `

    const tabs = [{ label: 'HTML' }, { label: 'CSS' }]

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 border-b pb-4">
                <div className="flex items-center space-x-4">
                    <div>
                        <input
                            type="text"
                            value={currentTheme.name}
                            onChange={e => handleNameChange(e.target.value)}
                            className="text-lg font-semibold bg-transparent border-none focus:ring-0 p-0"
                            placeholder="Theme name"
                        />
                    </div>
                    {currentTheme.user_id && (
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="is-active"
                                checked={currentTheme.is_active || false}
                                onChange={e => handleActiveToggle(e.target.checked)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="is-active" className="text-sm font-medium">
                                Set as active theme
                            </label>
                        </div>
                    )}
                </div>

                <div className="flex items-center space-x-2">
                    <Button onClick={() => setIsPreviewVisible(!isPreviewVisible)} outline={true} className="flex items-center space-x-2">
                        {isPreviewVisible ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        <span>{isPreviewVisible ? 'Hide' : 'Show'} Preview</span>
                    </Button>
                    <Button onClick={validateTheme} outline={true} disabled={isValidating}>
                        {isValidating ? 'Validating...' : 'Validate'}
                    </Button>
                    <Button onClick={handleSave}>Save Theme</Button>
                    <Button onClick={onCancel} outline={true}>
                        Cancel
                    </Button>
                </div>
            </div>

            {/* Validation Results */}
            {validationResult && (
                <div className="mb-4">
                    {validationResult.valid ? (
                        <Alert>
                            <CheckCircleIcon className="h-4 w-4" />
                            <AlertTitle>Theme validation passed</AlertTitle>
                            <AlertDescription>Your theme looks good and is safe to use.</AlertDescription>
                        </Alert>
                    ) : (
                        <Alert variant="destructive">
                            <XCircleIcon className="h-4 w-4" />
                            <AlertTitle>Theme validation failed</AlertTitle>
                            <AlertDescription>
                                {validationResult.error || 'Your theme contains potentially unsafe content that will be sanitized.'}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            )}

            {/* Error Alert */}
            {error && (
                <div className="mb-4">
                    <Alert variant="destructive">
                        <XCircleIcon className="h-4 w-4" />
                        <AlertTitle>Validation Error</AlertTitle>
                        <AlertDescription>
                            {error.split('\n').map((line, index) => (
                                <div key={index}>{line}</div>
                            ))}
                        </AlertDescription>
                    </Alert>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex space-x-4 overflow-hidden">
                {/* Editor Panel */}
                <div className="flex-1 flex flex-col">
                    <Tabs items={tabs} selectedIndex={activeTabIndex} onChange={setActiveTabIndex} />

                    <div className="flex-1 border rounded-lg overflow-hidden mt-4">
                        {activeTabIndex === 0 && (
                            <MonacoEditorWrapper language="html" defaultValue={currentTheme.html} onChange={handleHtmlChange} isUserTheme={!!currentTheme.user_id} />
                        )}
                        {activeTabIndex === 1 && (
                            <MonacoEditorWrapper language="css" defaultValue={currentTheme.css} onChange={handleCssChange} isUserTheme={!!currentTheme.user_id} />
                        )}
                    </div>
                </div>

                {/* Preview Panel */}
                {isPreviewVisible && (
                    <div className="w-1/2 flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium">Theme Preview</h3>
                        </div>
                        <div className="flex-1 border rounded-lg overflow-hidden bg-white">
                            <iframe className="w-full h-full" srcDoc={previewHtml} sandbox="allow-same-origin" title="Theme Preview" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
