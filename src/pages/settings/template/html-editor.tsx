import React, {useEffect, useRef, useState} from 'react'
// Initialize HTML language features
import * as monaco from 'monaco-editor'
import {Button} from '@/components/shared/experimental-button-rework.tsx'
import {Alert, AlertDescription, AlertTitle} from '@/components/shared/alert.tsx'
import Card from '@/components/shared/card.tsx'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import HTMLMonacoLinter, {HTMLMonacoMarks} from 'monaco-html-linter'
import {EyeIcon, EyeSlashIcon} from '@heroicons/react/24/solid'
import {CheckCircleIcon, XCircleIcon} from '@heroicons/react/20/solid'
import ShowLightbulbIconMode = monaco.editor.ShowLightbulbIconMode

const linterConfig = {
    // Document Rules
    'doctype-first': false,              // Doctype must be declared first
    'doctype-html5': true,              // Invalid doctype
    'html-lang-require': true,          // The lang attribute of the <html> element must be present

    // Head Rules
    'head-script-disabled': true,       // The <script> tag cannot be used in a <head> tag
    'script-disabled': true,            // <script> tags cannot be used
    'iframe-disabled': true,            // <iframe> tags cannot be used
    'title-require': true,              // <title> must be present in <head> tag

    // Attribute Rules
    'attr-lowercase': true,             // All attribute names must be in lowercase
    'attr-no-duplication': true,        // Elements cannot have duplicate attributes
    'attr-no-unnecessary-whitespace': true, // No spaces between attribute names and values
    'attr-unsafe-chars': true,          // Attribute values cannot contain unsafe chars
    'attr-value-double-quotes': true,   // Attribute values must be in double quotes
    'attr-value-not-empty': true,       // All attributes must have values
    'alt-require': true,                // The alt attribute of an element must be present and alt attribute of area[href] and input[type=image] must have a value

    // Tags Rules
    'tags-check': true,                 // Checks html tags
    'tag-pair': true,                   // Tag must be paired
    'tag-self-close': true,             // Empty tags must be self closed
    'tagname-lowercase': true,          // All html element names must be in lowercase
    'empty-tag-not-self-closed': true,  // Empty tags must not use self-closing syntax
    'src-not-empty': true,              // The src attribute of an img(script,link) must have a value
    'href-abs-or-rel': false,           // An href attribute must be either absolute or relative

    // ID Rules
    'id-class-ad-disabled': true,       // The id and class attributes cannot use the ad keyword
    'id-class-value': false,            // The id and class attribute values must meet the specified rules
    'id-unique': true,                  // The value of id attributes must be unique

    // Inline Rules
    'inline-script-disabled': true,     // Inline script cannot be used
    'inline-style-disabled': false,      // Inline style cannot be used

    // Style Rules
    'space-tab-mixed-disabled': true,   // Do not mix tabs and spaces for indentation
    'spec-char-escape': true,           // Special characters must be escaped
}

// Initialize Monaco workers
self.MonacoEnvironment = {
    getWorker(_, label) {
        if (label === 'html') {
            return new htmlWorker()
        }
        return new editorWorker()
    }
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
const MonacoEditorWrapper = ({defaultValue, onChange}) => {
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
                        placeholder: `/* Write your HTML code here! Or, leave blank to entirely disable custom code. */`,
                        value: defaultValue,
                        language: 'html',
                        theme: 'vs-dark',
                        minimap: {enabled: false},
                        fontSize: 14,
                        lineNumbers: 'on',
                        roundedSelection: true,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        padding: {top: 16},
                        formatOnPaste: true,
                        formatOnType: true,
                        wordWrap: 'on',
                        suggest: {
                            snippetsPreventQuickSuggestions: false
                        },
                        // Enable quick suggestions
                        quickSuggestions: {
                            other: true,
                            comments: true,
                            strings: true
                        },
                        // Configure validation features
                        lightbulb: {
                            enabled: ShowLightbulbIconMode.On
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

                    // @ts-ignore
                    const linter = new HTMLMonacoLinter(editorRef.current, monaco, linterConfig)
                    linter.watch()

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
                    console.error('Failed to initialize Monaco editor:', error)
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
    }, [])

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
            style={{visibility: isEditorReady ? 'visible' : 'hidden'}}
        />
    )
}

const HTMLProfileEditor = () => {
    const [showPreview, setShowPreview] = useState(false)
    const [error, setError] = useState('')
    const [code, setCode] = useState(`<div class="profile">
  <h1>My Profile</h1>
  <p>Welcome to my page!</p>
</div>`)

    // List of blocked HTML elements for security
    const BLOCKED_ELEMENTS = [
        'script',        // Prevents JavaScript injection
        'iframe',        // Prevents iframe embedding
        'object',        // Prevents embedding of external objects
        'embed',         // Prevents embedding of external content
        'form',          // Prevents form submission
        'input',         // Prevents form inputs
        'button',        // Prevents button elements
        'link',          // Prevents external stylesheet loading
        'meta',          // Prevents metadata manipulation
        'video',         // Prevents video embedding
        'audio',         // Prevents audio embedding
        'canvas',        // Prevents canvas manipulation
        'svg',           // Prevents SVG (which can contain scripts)
    ]

    // Check for blocked elements in HTML
    const checkForBlockedElements = (htmlContent) => {
        const parser = new DOMParser()
        const doc = parser.parseFromString(htmlContent, 'text/html')

        for (const element of BLOCKED_ELEMENTS) {
            const found = doc.getElementsByTagName(element)
            if (found.length > 0) {
                return `The use of <${element}> tags is not allowed for security reasons.`
            }
        }

        // Check for event handlers
        const allElements = doc.getElementsByTagName('*')
        for (const el of allElements) {
            const attributes = el.attributes
            for (const attr of attributes) {
                if (attr.name.toLowerCase().startsWith('on')) {
                    return `Event handlers (like ${attr.name}) are not allowed for security reasons.`
                }
            }
        }

        return null
    }

    // Debounce validation to prevent too frequent updates
    const validateTimeoutRef = useRef(null)

    const validateHTML = (htmlContent) => {
        try {
            const parser = new DOMParser()
            const doc = parser.parseFromString(htmlContent, 'text/html')
            const errors = doc.getElementsByTagName('parsererror')
            const warnings = doc.getElementsByTagName('warning')

            const report = (new HTMLMonacoMarks(htmlContent, linterConfig)).getLinterResponse()

            for (const error of report) {
                if (['error', 'warning'].includes(error.type)) {
                    setError(error.message)
                    return false
                }
            }

            // First check for blocked elements
            const blockedError = checkForBlockedElements(htmlContent)
            if (blockedError) {
                setError(blockedError)
                return false
            }

            // Warning if using <style> tag
            const styleTags = doc.getElementsByTagName('style')
            if (styleTags.length > 0) {
                // Warning if using * selector in CSS
                const cssContent = doc.getElementsByTagName('style')[0]?.textContent
                if (cssContent && cssContent.includes('*')) {
                    setError('The use of the * selector is not allowed.')
                    return false
                }

                setError('The use of <style> tags is discouraged.\nWhile it\'s allowed (and in some places encouraged), modifying the page too much may result in you losing access to ever using it again!')
                setCode(htmlContent)
                return true
            }

            setError('')
            setCode(htmlContent)
            return true
        } catch (e) {
            setError('Invalid HTML. Please check your code.')
            return false
        }
    }

    const handleEditorChange = (newValue) => {
        // Debounce validation
        if (validateTimeoutRef.current) {
            clearTimeout(validateTimeoutRef.current)
        }
        validateTimeoutRef.current = setTimeout(() => {
            validateHTML(newValue)
        }, 500)
    }

    const handleSave = () => {
        if (validateHTML(code)) {
            // Here you would typically save to a backend
            console.log('Saving HTML:', code)
        }
    }

    // Cleanup validation timeout
    useEffect(() => {
        return () => {
            if (validateTimeoutRef.current) {
                clearTimeout(validateTimeoutRef.current)
            }
        }
    }, [])

    return (
        <div className="space-y-4">
            {/* Editor Controls */}
            <div className="flex justify-between items-center">
                <Button
                    outline
                    onClick={() => setShowPreview(!showPreview)}
                >
                    {showPreview ? <EyeIcon className="mr-2 inline-flex"/> : <EyeSlashIcon className="mr-2 inline-flex"/>}
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                </Button>

                <div className="text-sm text-alt">
                    {error ?
                        <span className="flex items-center text-tertiary">
                            <XCircleIcon className="mr-1 h-4 w-4 inline-flex"/>
                            Can't upload this code
                        </span>
                        :
                        <span className="flex items-center text-green-500">
                            <CheckCircleIcon className="mr-1 h-4 w-4 inline-flex"/>
                            Allowed
                        </span>
                    }
                </div>

                <Button onClick={handleSave} disabled={!!error}>
                    <CheckCircleIcon className="mr-2 inline-flex"/>
                    Save Changes
                </Button>
            </div>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    {error.split('\n').map((line, index) => index === 0 ? (
                        <AlertTitle key={index}>{line}</AlertTitle>
                    ) : (
                        <AlertDescription key={index}>{line}</AlertDescription>
                    ))}
                </Alert>
            )}

            {/* Monaco Editor */}
            <MonacoEditorWrapper
                defaultValue={code}
                onChange={handleEditorChange}
            />

            {/* Preview Panel */}
            {showPreview && (
                <Card className="mt-4">
                    <div
                        className="preview-container"
                        dangerouslySetInnerHTML={{__html: code}}
                    />
                </Card>
            )}
        </div>
    )
}

export default HTMLProfileEditor