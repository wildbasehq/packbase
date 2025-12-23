import fs from 'fs'
// @ts-ignore
import {Box, render, Text, useInput} from 'ink'
import path from 'path'
import {useState} from 'react'

// Step component to handle each step of the wizard
const Step = ({
                  title,
                  description,
                  value,
                  onChange,
                  onSubmit,
                  placeholder = ''
              }) => {
    useInput((input, key) => {
        if (key.return) {
            console.log(`Enter key pressed in step: ${title}`)
            onSubmit()
            console.log('onSubmit called')
        } else if (key.backspace || key.delete) {
            onChange(value.slice(0, -1))
        } else if (!key.ctrl && !key.meta && !key.escape && input.length === 1) {
            onChange(value + input)
        }
    })

    return (
        <Box flexDirection="column">
            <Text bold>{title}</Text>
            <Text>{description}</Text>
            <Box marginY={1} borderStyle="single" padding={1}>
                <Text>{value || placeholder}</Text>
            </Box>
            <Text dimColor>Press Enter to continue</Text>
        </Box>
    )
}

// Main component
const CreateRoute = () => {
    const [step, setStep] = useState(0)
    const [routePath, setRoutePath] = useState('')
    const [routeName, setRouteName] = useState('')
    const [routeDescription, setRouteDescription] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [isComplete, setIsComplete] = useState(false)
    const [error, setError] = useState('')

    // Add global input handler for the confirmation step
    useInput((input, key) => {
        if (key.return && step === 3) {
            console.log('Enter key pressed in confirmation step')
            createRoute()
        }
    })

    const nextStep = () => {
        console.log(`Moving from step ${step} to next step`)
        if (step < 3) {
            setStep(step + 1)
        } else {
            console.log('Starting route creation')
            createRoute()
        }
    }

    const createRoute = async () => {
        console.log('createRoute function called')
        setIsCreating(true)
        setError('')

        try {
            // Validate inputs
            if (!routePath) {
                throw new Error('Route path is required')
            }

            // Normalize route path (remove leading/trailing slashes)
            const normalizedPath = routePath.replace(/^\/+|\/+$/g, '')
            console.log(`Normalized path: ${normalizedPath}`)

            // Get the directory path and ensure it exists
            const pathParts = normalizedPath.split('/')
            const fileName = pathParts.pop() + '.ts' // Last part becomes the file name with .ts extension
            const dirPath = path.join(process.cwd(), 'src', 'routes', ...pathParts)
            console.log(`Directory path: ${dirPath}`)
            console.log(`File name: ${fileName}`)

            if (!fs.existsSync(dirPath)) {
                console.log(`Creating directory: ${dirPath}`)
                fs.mkdirSync(dirPath, {recursive: true})
            } else {
                console.log(`Directory already exists: ${dirPath}`)
            }

            // Create the .ts file with route template
            const filePath = path.join(dirPath, fileName)
            console.log(`File path: ${filePath}`)
            const routeContent = `import { YapockType } from '@/index'
import { t } from 'elysia'
import requiresToken from '@/utils/identity/requires-token'

export default (app: YapockType) =>
  app
    .get(
      '',
      async ({ set, user }) => {
        requiresToken({ set, user })

        return {
          message: 'Hello from ${routePath}'
        }
      },
      {
        detail: {
          description: '${routeDescription || `Route for ${routePath}`}',
          tags: ['${routeName || normalizedPath}'],
        },
        response: {
          200: t.Object({
            message: t.String()
          })
        }
      },
    )
`

            console.log('Writing file...')
            fs.writeFileSync(filePath, routeContent)
            console.log('File written successfully')
            setIsComplete(true)
        } catch (err) {
            console.error('Error creating route:', err)
            setError(err.message)
        } finally {
            setIsCreating(false)
            console.log('createRoute function completed')
        }
    }

    console.log(`Render state - step: ${step}, isCreating: ${isCreating}, isComplete: ${isComplete}, error: ${error ? 'yes' : 'no'}`)

    if (isComplete) {
        console.log('Rendering complete state')
        // Normalize path for display
        const normalizedPath = routePath.replace(/^\/+|\/+$/g, '')
        const pathParts = normalizedPath.split('/')
        const fileName = pathParts.pop() + '.ts'
        const displayPath = [...pathParts, fileName].join('/')

        // Quit after rendering
        setTimeout(() => process.exit(0), 1000)

        return (
            <Box flexDirection="column" padding={1}>
                <Text color="green">✓ Route created successfully!</Text>
                <Text>Path: {routePath}</Text>
                <Text>File created: src/routes/{displayPath}</Text>
            </Box>
        )
    }

    if (error) {
        console.log(`Rendering error state: ${error}`)
        return (
            <Box flexDirection="column" padding={1}>
                <Text color="red">Error: {error}</Text>
                <Text>Please try again.</Text>
            </Box>
        )
    }

    if (isCreating) {
        console.log('Rendering creating state')
        return (
            <Box padding={1}>
                <Text>Creating route...</Text>
            </Box>
        )
    }

    return (
        <Box flexDirection="column" padding={1}>
            <Text bold color="green">Create New Route Wizard</Text>

            {step === 0 && (
                <Step
                    title="Route Path"
                    description="Enter the path for your route (e.g., 'user/profile' or 'api/data')"
                    value={routePath}
                    onChange={setRoutePath}
                    onSubmit={nextStep}
                    placeholder="Enter route path..."
                />
            )}

            {step === 1 && (
                <Step
                    title="Route Name"
                    description="Enter a name for this route (used in API documentation)"
                    value={routeName}
                    onChange={setRouteName}
                    onSubmit={nextStep}
                    placeholder="Enter route name..."
                />
            )}

            {step === 2 && (
                <Step
                    title="Route Description"
                    description="Enter a description for this route (used in API documentation)"
                    value={routeDescription}
                    onChange={setRouteDescription}
                    onSubmit={nextStep}
                    placeholder="Enter route description..."
                />
            )}

            {step === 3 && (
                <Box flexDirection="column" marginY={1}>
                    <Text bold>Confirm Route Creation</Text>
                    <Box marginY={1}>
                        <Text>Path: </Text>
                        <Text color="green">{routePath}</Text>
                    </Box>
                    <Box>
                        <Text>Name: </Text>
                        <Text color="green">{routeName || 'Not specified'}</Text>
                    </Box>
                    <Box>
                        <Text>Description: </Text>
                        <Text color="green">{routeDescription || 'Not specified'}</Text>
                    </Box>
                    <Text marginY={1}>Press Enter to create the route</Text>
                </Box>
            )}
        </Box>
    )
}

// Render the app
render(<CreateRoute/>)
