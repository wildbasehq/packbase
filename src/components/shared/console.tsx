import {useEffect, useRef, useState} from 'react'
import {vg} from '@/lib/api'
import {toast} from 'sonner'

const Console = () => {
    const [input, setInput] = useState('')
    const [history, setHistory] = useState([])
    const [commands, setCommands] = useState({})
    const [commandHistory, setCommandHistory] = useState([])
    const [historyIndex, setHistoryIndex] = useState(-1)
    const [isVisible, setIsVisible] = useState(false)
    const inputRef = useRef(null)
    const consoleEndRef = useRef(null)

    // Register a new command
    const registerCommand = (name, options) => {
        setCommands(prevCommands => ({
            ...prevCommands,
            [name]: options
        }))
    }

    // Initialize built-in commands
    useEffect(() => {
        // Help command
        registerCommand('help', {
            description: 'Display available commands',
            handler: (args) => {
                const commandName = args[0]

                if (commandName && commands[commandName]) {
                    const cmd = commands[commandName]
                    let output = `${commandName}: ${cmd.description}\n`

                    if (cmd.params && cmd.params.length > 0) {
                        output += 'Parameters:\n'
                        cmd.params.forEach(param => {
                            const paramType = param.required ? 'required' : 'optional'
                            output += `  ${param.name} (${paramType}): ${param.description}\n`
                        })
                    }

                    return output
                }
            },
            params: [
                {name: 'command', description: 'Command to get help for', required: true}
            ]
        })

        // Clear command
        registerCommand('clear', {
            description: 'Clear the console',
            handler: () => {
                setHistory([])
                return ''
            }
        })

        // Hide command
        registerCommand('hide', {
            description: 'Hide the console',
            handler: () => {
                setIsVisible(false)
                return 'Console hidden. Press Ctrl+Shift+Alt+F12 to show again.'
            }
        })

        // Date command
        registerCommand('date', {
            description: 'Display current date and time',
            handler: () => new Date().toString()
        })

        // Send API request
        registerCommand('api', {
            description: 'Send an API request',
            params: [
                {name: 'component', description: 'SDK Component', required: true},
            ],
            handler: async (args) => {
                const component = args[0]
                const argument_one = args[1]

                if (component === 'invite_admin_gen') {
                    return await vg.invite.generate.post({
                        for: argument_one
                    }).then(({data, error}) => {
                        if (error) {
                            toast.error(error.value ? `${error.status}: ${error.value.summary}` : 'Something went wrong')
                            return error.value ? `${error.status}: ${error.value.summary}` : 'Something went wrong'
                        }

                        return data.invite_code
                    })
                } else {
                    return 'Error: Invalid component'
                }
            }
        })
    }, []) // Empty dependency array ensures this only runs once

    // Handle keyboard shortcuts for showing/hiding console
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Check for CMD/CTRL + SHIFT + OPT/ALT + F12
            if (
                (e.ctrlKey || e.metaKey) &&
                e.shiftKey &&
                (e.altKey) &&
                e.key === 'F12'
            ) {
                setIsVisible(prev => !prev)

                // If we're showing the console, focus the input after a short delay
                if (!isVisible) {
                    setTimeout(() => {
                        inputRef.current?.focus()
                    }, 100)
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [isVisible])

    // Parse command input
    const parseCommand = (input) => {
        const tokens = input.trim().split(/\s+/)
        const command = tokens[0]
        const args = tokens.slice(1)

        return {command, args}
    }

    // Execute a command
    const executeCommand = async (commandInput) => {
        // Add to command history
        setCommandHistory(prev => [...prev, commandInput])
        setHistoryIndex(-1)

        // Parse the command
        const {command, args} = parseCommand(commandInput)

        // Add command to history
        const newEntry = {type: 'command', text: commandInput}
        setHistory(prev => [...prev, newEntry])

        // Check if command exists
        if (!commands[command]) {
            const errorMsg = `Command not found: ${command}.`
            setHistory(prev => [...prev, {type: 'error', text: errorMsg}])
            return
        }

        // Validate required parameters
        const cmdDef = commands[command]
        const requiredParams = cmdDef.params ? cmdDef.params.filter(param => param.required) : []

        if (args.length < requiredParams.length) {
            const missingParams = requiredParams
                .slice(args.length)
                .map(param => param.name)
                .join(', ')

            const errorMsg = `Missing required parameters: ${missingParams}`
            setHistory(prev => [...prev, {type: 'error', text: errorMsg}])
            return
        }

        // Execute the command handler
        try {
            const output = await cmdDef.handler(args)
            console.log(output)

            if (output && output !== '') {
                setHistory(prev => [...prev, {type: output.startsWith('Error') ? 'error' : 'output', text: output}])
            }
        } catch (error) {
            setHistory(prev => [
                ...prev,
                {type: 'error', text: `Error executing command: ${error.message}`}
            ])
        }
    }

    // Handle input submission
    const handleSubmit = (e) => {
        e.preventDefault()

        if (input.trim() === '') return

        executeCommand(input)
        setInput('')
    }

    // Handle key navigation through command history
    const handleInputKeyDown = (e) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault()

            if (commandHistory.length > 0) {
                const newIndex = historyIndex < commandHistory.length - 1
                    ? historyIndex + 1
                    : historyIndex

                setHistoryIndex(newIndex)
                setInput(commandHistory[commandHistory.length - 1 - newIndex])
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault()

            if (historyIndex > 0) {
                const newIndex = historyIndex - 1
                setHistoryIndex(newIndex)
                setInput(commandHistory[commandHistory.length - 1 - newIndex])
            } else if (historyIndex === 0) {
                setHistoryIndex(-1)
                setInput('')
            }
        } else if (e.key === 'Tab') {
            e.preventDefault()

            // Simple command auto-completion
            const term = input.trim().split(/\s+/)[0]

            if (term) {
                const matches = Object.keys(commands).filter(cmd =>
                    cmd.startsWith(term)
                )

                if (matches.length === 1) {
                    setInput(matches[0] + ' ')
                }
            }
        } else if (e.key === 'Escape') {
            setIsVisible(false)
        }
    }

    // Auto-scroll to bottom
    useEffect(() => {
        consoleEndRef.current?.scrollIntoView({behavior: 'smooth'})
    }, [history])

    // Focus input when console becomes visible
    useEffect(() => {
        if (isVisible) {
            inputRef.current?.focus()
        }
    }, [isVisible])

    // If console is not visible, return null
    if (!isVisible) {
        return null
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-md bg-opacity-50">
            <div className="w-4/5 h-3/4 bg-black text-emerald-400 font-mono text-sm rounded-md flex flex-col shadow-lg">
                <div className="p-2 border-b shadow-lg shadow-emerald-600/20 border-emerald-700 bg-emerald-900 text-white flex justify-between items-center">
                    <span>✱ Playtool</span>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="text-white hover:text-red-300 focus:outline-none"
                        aria-label="Close console"
                    >
                        ×
                    </button>
                </div>

                <div className="flex-1 p-2 overflow-auto">
                    <div className="text-yellow-400 mb-2">
                        Type 'help' for available commands. Double press `+` for Kukiko.
                    </div>
                    {history.map((entry, index) => (
                        <div
                            key={index}
                            className={`mb-1 ${
                                entry.type === 'error'
                                    ? 'text-red-400'
                                    : entry.type === 'command'
                                        ? 'text-yellow-400'
                                        : 'text-emerald-400'
                            }`}
                        >
                            {entry.type === 'command' && '> '}
                            {entry.text.split('\n').map((line, i) => (
                                <div key={i}>{line}</div>
                            ))}
                        </div>
                    ))}
                    <div ref={consoleEndRef}/>
                </div>

                <form onSubmit={handleSubmit} className="p-2 border-t border-emerald-700 flex">
                    <span className="mr-2">{'>'}</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                        className="flex-1 bg-transparent outline-none"
                        aria-label="Console input"
                        autoComplete="off"
                    />
                </form>
            </div>
        </div>
    )
}

export default Console