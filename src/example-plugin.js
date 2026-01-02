/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

/**
 * Example Packbase Plugin
 *
 * This is a demonstration plugin showing how to use the Packbase plugin API.
 * To test this plugin, open your browser console and paste this code.
 */

;(function () {
    // Check if Packbase API is available
    if (!window.packbase) {
        console.error("Packbase plugin API not found. Please make sure you're on a Packbase site.")
        return
    }

    // Define plugin metadata
    const pluginInfo = {
        name: 'Message Enhancer',
        version: '1.0.0',
        author: 'Example Developer',
        description: 'Enhances messages with emoji replacements and formatting options',
    }

    // Register the plugin with Packbase
    const pluginId = window.packbase.registerPlugin(pluginInfo)
    console.log(`Plugin registered with ID: ${pluginId}`)

    // Track event unsubscribe functions
    const unsubscribeFunctions = []

    // Listen for sent messages to enhance them
    unsubscribeFunctions.push(
        window.packbase.on('message:sent', event => {
            console.log('Message sent:', event.data)

            // Simple text replacement example
            if (event.data.content.includes(':)')) {
                console.log('Detected smiley face in message')
            }
        })
    )

    // Listen for thread opening
    unsubscribeFunctions.push(
        window.packbase.on('thread:opened', event => {
            console.log(`Thread opened: ${event.data.title} in channel #${event.data.channelId}`)

            // You could add custom UI elements or modify the thread view here
            setTimeout(() => {
                // Example: Add a custom button to the thread header
                const threadHeader = document.querySelector('.border-b.px-6.py-4')
                if (threadHeader && !document.getElementById('plugin-button')) {
                    const button = document.createElement('button')
                    button.id = 'plugin-button'
                    button.className = 'ml-2 px-3 py-1 bg-primary text-white rounded text-xs'
                    button.textContent = 'Plugin Action'
                    button.onclick = () => alert('Plugin action triggered!')
                    threadHeader.appendChild(button)
                }
            }, 500)
        })
    )

    // Create cleanup function
    function cleanup() {
        console.log('Cleaning up Message Enhancer plugin...')

        // Remove event listeners
        unsubscribeFunctions.forEach(unsubscribe => unsubscribe())

        // Remove any DOM elements added by the plugin
        const pluginButton = document.getElementById('plugin-button')
        if (pluginButton) pluginButton.remove()

        // Unregister the plugin
        window.packbase.unregisterPlugin(pluginId)
        console.log('Plugin cleanup complete')
    }

    // Expose cleanup function
    window.plugins = window.plugins || {}
    window.plugins.messageEnhancer = { cleanup }

    console.log('Message Enhancer plugin initialized successfully')

    // Show usage instructions
    console.log('\nTo unload this plugin, run: window.plugins.messageEnhancer.cleanup()')
})()
