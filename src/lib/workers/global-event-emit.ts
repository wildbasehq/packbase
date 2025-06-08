/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

/**
 * Facilitates event emission to the global window object.
 * This module provides a standardized API for plugins to subscribe to and emit events.
 */

// Define the event data structure
interface PackbaseEventData {
    type: string
    data: any
    timestamp: number
    source: string
}

// Define the plugin API that will be exposed globally
interface PackbasePluginAPI {
    // Event methods
    on(eventName: string, callback: (data: PackbaseEventData) => void): () => void
    off(eventName: string, callback: (data: PackbaseEventData) => void): void
    once(eventName: string, callback: (data: PackbaseEventData) => void): void
    emit(eventName: string, data: any): void

    // Plugin registration
    registerPlugin(pluginInfo: PluginInfo): string
    unregisterPlugin(pluginId: string): boolean
    getRegisteredPlugins(): PluginInfo[]

    // Version info
    version: string
}

// Plugin information interface
interface PluginInfo {
    name: string
    version: string
    author: string
    description: string
    permissions?: string[]
}

declare global {
    interface Window {
        packbase_events: EventTarget
        packbase: PackbasePluginAPI
    }
}

const log = (...content: any[]) => {
    console.debug(`%c[Extension SDK: Unsafe!!!]`, 'color: #059669; font-weight: bold;', ...content)
}

// Ensure the EventTarget exists
if (!window.packbase) {
    log(`Hi there!
    
    ✨ This is the Packbase Extension SDK. It provides a standardized API for plugins to subscribe to and emit events.
    🚧 IT IS CURRENTLY WIP.
    🤔 If you have any questions, please join our Discord server: https://discord.gg/StuuK55gYA
    
    ⚙️ ~~stolen~~ borrowed from Yipnyap, our prev project. Sparked from someone on our Discord.
    🚀 Get started by viewing \`window.packbase\` in your browser's console. \`window.voyageSDK\` is also available.
    
    Example usage (registering a plugin):
    const pluginInfo = {
        name: 'Example Plugin',
        version: '1.0.0',
        author: 'Example Developer',
        description: 'This is an example plugin',
        permissions: ['packbase.user.profile.read', 'packbase.user.profile.write'],
    }
    
    const pluginId = window.packbase.registerPlugin(pluginInfo)
    console.log('Plugin registered with ID:', pluginId)
    `)
}
// Keep track of registered plugins
const registeredPlugins: Map<string, PluginInfo> = new Map()
log('Plugin registry initialized')

// Event listener management
const eventListeners: Map<string, Set<(data: PackbaseEventData) => void>> = new Map()
log('Event listener registry initialized')

/**
 * Creates a unique ID for a plugin
 */
function generatePluginId(pluginInfo: PluginInfo): string {
    log(`Generating plugin ID for ${pluginInfo.name} v${pluginInfo.version} by ${pluginInfo.author}`)
    return `${pluginInfo.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
}

/**
 * The Packbase Plugin API implementation
 */
const extSDK: PackbasePluginAPI = {
    /**
     * Registers an event listener
     * @param eventName - The name of the event to listen for
     * @param callback - The function to call when the event is triggered
     * @returns A function that removes the event listener when called
     */
    on(eventName: string, callback: (data: PackbaseEventData) => void): () => void {
        log(`Registering listener for event: ${eventName}`)
        if (!eventListeners.has(eventName)) {
            eventListeners.set(eventName, new Set())
        }

        const listeners = eventListeners.get(eventName)!
        listeners.add(callback)
        log(`Added callback to ${eventName} listeners (total: ${listeners.size})`)
        log(`Total unique event types being listened to: ${eventListeners.size}`)

        // Return a function that removes this specific listener
        return () => this.off(eventName, callback)
    },

    /**
     * Removes an event listener
     * @param eventName - The name of the event
     * @param callback - The callback function to remove
     */
    off(eventName: string, callback: (data: PackbaseEventData) => void): void {
        log(`Removing listener for event: ${eventName}`)
        const listeners = eventListeners.get(eventName)
        if (listeners) {
            const result = listeners.delete(callback)
            log(`Removed callback from ${eventName} listeners: ${result ? 'success' : 'not found'}`)
            if (listeners.size === 0) {
                eventListeners.delete(eventName)
                log(`No more listeners for ${eventName}, removing event entry`)
            } else {
                log(`Remaining listeners for ${eventName}: ${listeners.size}`)
            }
        } else {
            log(`No listeners found for event: ${eventName}`)
        }
    },

    /**
     * Registers a one-time event listener
     * @param eventName - The name of the event to listen for
     * @param callback - The function to call when the event is triggered
     */
    once(eventName: string, callback: (data: PackbaseEventData) => void): void {
        log(`Registering one-time listener for event: ${eventName}`)
        const onceWrapper = (data: PackbaseEventData) => {
            log(`Executing one-time callback for event: ${eventName}`)
            this.off(eventName, onceWrapper)
            callback(data)
        }

        this.on(eventName, onceWrapper)
    },

    /**
     * Emits an event with the provided data
     * @param eventName - The name of the event to emit
     * @param data - The data to include with the event
     */
    emit(eventName: string, data: any): void {
        log(`Emitting event: ${eventName}`)
        const startTime = performance.now()
        const eventData: PackbaseEventData = {
            type: eventName,
            data,
            timestamp: Date.now(),
            source: 'packbase',
        }

        // Notify listeners registered through our API
        const listeners = eventListeners.get(eventName)
        if (listeners) {
            log(`Found ${listeners.size} listeners for event: ${eventName}`)
            listeners.forEach(callback => {
                try {
                    callback(eventData)
                    log(`Successfully executed callback for event: ${eventName}`)
                } catch (error) {
                    console.error(`Error in event listener for '${eventName}':`, error)
                    log(`Error in event listener for '${eventName}':`, error)
                    log(`Error occurred at: ${new Date().toISOString()}, event type: ${eventName}, data:`, eventData.data)
                }
            })
        } else {
            log(`No listeners found for event: ${eventName}`)
        }

        // Log event for debugging (can be removed in production)
        console.debug(`[Packbase] Event emitted: ${eventName}`, eventData)
        log(`Event details: type=${eventData.type}, timestamp=${new Date(eventData.timestamp).toISOString()}, source=${eventData.source}`)
        const endTime = performance.now()
        log(`Event emission performance: ${(endTime - startTime).toFixed(2)}ms`)
    },

    /**
     * Registers a plugin with the Packbase system
     * @param pluginInfo - Information about the plugin
     * @returns A unique plugin ID
     */
    registerPlugin(pluginInfo: PluginInfo): string {
        log(`Registering plugin: ${pluginInfo.name} v${pluginInfo.version} by ${pluginInfo.author}`)
        if (pluginInfo.permissions?.length) {
            log(`Plugin ${pluginInfo.name} requests permissions: ${pluginInfo.permissions.join(', ')}`)
        } else {
            log(`Plugin ${pluginInfo.name} does not request any special permissions`)
        }
        const pluginId = generatePluginId(pluginInfo)
        registeredPlugins.set(pluginId, pluginInfo)
        log(`Plugin stored with ID: ${pluginId}`)

        // Emit an event when a plugin is registered
        this.emit('plugin:registered', { pluginId, pluginInfo })

        console.log(`[Packbase] Plugin registered: ${pluginInfo.name} v${pluginInfo.version}`)
        return pluginId
    },

    /**
     * Unregisters a plugin
     * @param pluginId - The ID of the plugin to unregister
     * @returns Whether the plugin was successfully unregistered
     */
    unregisterPlugin(pluginId: string): boolean {
        log(`Attempting to unregister plugin with ID: ${pluginId}`)
        const pluginInfo = registeredPlugins.get(pluginId)
        if (!pluginInfo) {
            log(`Plugin with ID ${pluginId} not found`)
            return false
        }

        log(`Found plugin: ${pluginInfo.name} v${pluginInfo.version}`)
        const result = registeredPlugins.delete(pluginId)

        if (result && pluginInfo) {
            log(`Successfully removed plugin from registry: ${pluginInfo.name}`)
            // Emit an event when a plugin is unregistered
            this.emit('plugin:unregistered', { pluginId, pluginInfo })
            console.log(`[Packbase] Plugin unregistered: ${pluginInfo.name}`)
        } else {
            log(`Failed to remove plugin from registry: ${pluginId}`)
        }

        return result
    },

    /**
     * Gets a list of all registered plugins
     * @returns An array of plugin information objects
     */
    getRegisteredPlugins(): PluginInfo[] {
        const plugins = Array.from(registeredPlugins.values())
        log(`Retrieved ${plugins.length} registered plugins`)
        log(`Active plugins: ${plugins.map(p => p.name).join(', ') || 'none'}`)
        return plugins
    },

    // API version
    version: '1.0.0',
}

// Expose the API globally
log('Exposing Extension API to global window object')
window.packbase = extSDK

// Export the API for internal use
export const PackbaseEvents = extSDK
log('Extension API created and exported')

/**
 * Helper function to emit events from anywhere in the codebase
 * @param eventName - The name of the event to emit
 * @param data - The data to include with the event
 */
export function emitEvent(eventName: string, data: any): void {
    log(`emitEvent helper called for: ${eventName}`)
    PackbaseEvents.emit(eventName, data)
}

/**
 * Helper function to subscribe to events from anywhere in the codebase
 * @param eventName - The name of the event to listen for
 * @param callback - The function to call when the event is triggered
 * @returns A function that removes the event listener when called
 */
export function onEvent(eventName: string, callback: (data: PackbaseEventData) => void): () => void {
    log(`onEvent helper called for: ${eventName}`)
    return PackbaseEvents.on(eventName, callback)
}
