# Packbase Plugin Development

This document provides guidelines and API documentation for developing plugins for Packbase. Similar to platforms like
BetterDiscord or BetterTTV, Packbase allows for customization and extension through plugins.

## Getting Started

Plugins for Packbase are JavaScript or TypeScript modules that interact with the application through the global
`window.packbase` API.

### Plugin Registration

A basic plugin should register itself with Packbase:

```javascript
const myPlugin = {
  name: "My Awesome Plugin",
  version: "1.0.0",
  author: "Your Name",
  description: "This plugin adds awesome features to Packbase"
};

// Register the plugin and store the ID
const pluginId = window.packbase.registerPlugin(myPlugin);

// Your plugin code goes here
```

## Event System

The core of plugin development is the event system, which allows plugins to react to changes in the application.

### Subscribing to Events

```javascript
// Listen for an event
const unsubscribe = window.packbase.on('message:received', (eventData) => {
  console.log('New message received:', eventData.data);
});

// Later, to stop listening
unsubscribe();

// Or using the direct off method
window.packbase.off('message:received', myCallbackFunction);

// Listen for an event only once
window.packbase.once('user:login', (eventData) => {
  console.log('User logged in:', eventData.data);
});
```

### Emitting Events

Plugins can also emit events:

```javascript
// Emit an event that other plugins can listen for
window.packbase.emit('my-plugin:feature-activated', { 
  feature: 'coolFeature',
  enabled: true 
});
```

## Available Events

Packbase emits the following events that plugins can listen for:

| Event Name            | Description                          | Data Structure                              |
|-----------------------|--------------------------------------|---------------------------------------------|
| `message:received`    | Fired when a new message is received | `{ messageId, content, author, timestamp }` |
| `message:sent`        | Fired when the user sends a message  | `{ messageId, content, timestamp }`         |
| `howl:opened`         | Fired when a howl is opened          | `{ howlId, channelId, title }`              |
| `user:login`          | Fired when a user logs in            | `{ userId, username }`                      |
| `user:logout`         | Fired when a user logs out           | `{}`                                        |
| `plugin:registered`   | Fired when a plugin is registered    | `{ pluginId, pluginInfo }`                  |
| `plugin:unregistered` | Fired when a plugin is unregistered  | `{ pluginId, pluginInfo }`                  |

## Plugin API Reference

### Event Methods

- `window.packbase.on(eventName, callback)`: Subscribe to an event
- `window.packbase.off(eventName, callback)`: Unsubscribe from an event
- `window.packbase.once(eventName, callback)`: Subscribe to an event, but only trigger once
- `window.packbase.emit(eventName, data)`: Emit an event

### Plugin Management

- `window.packbase.registerPlugin(pluginInfo)`: Register a plugin
- `window.packbase.unregisterPlugin(pluginId)`: Unregister a plugin
- `window.packbase.getRegisteredPlugins()`: Get information about all registered plugins

### Other Properties

- `window.packbase.version`: API version string

## Best Practices

1. **Namespace Your Events**: When emitting custom events, prefix them with your plugin name to avoid conflicts
2. **Clean Up**: Always unregister listeners when your plugin is disabled or uninstalled
3. **Error Handling**: Wrap event callbacks in try/catch to prevent errors from affecting the main application
4. **Permissions**: Request only the permissions your plugin needs
5. **Performance**: Be mindful of performance, especially with frequently triggered events

## Example Plugin

Here's a complete example plugin that adds a feature to highlight messages containing specific keywords:

```javascript
// Keyword Highlighter Plugin
const keywordHighlighter = {
  name: "Keyword Highlighter",
  version: "1.0.0",
  author: "Packbase Developer",
  description: "Highlights messages containing specified keywords"
};

// Register the plugin
const pluginId = window.packbase.registerPlugin(keywordHighlighter);

// Plugin settings
const settings = {
  keywords: ['important', 'urgent', 'attention'],
  highlightColor: '#ffe066'
};

// Listen for new messages
const messageListener = window.packbase.on('message:received', (event) => {
  const message = event.data;

  // Check if message contains any keywords
  const containsKeyword = settings.keywords.some(keyword => 
    message.content.toLowerCase().includes(keyword.toLowerCase())
  );

  if (containsKeyword) {
    // Find the message element and highlight it
    setTimeout(() => {
      const messageElement = document.querySelector(`[data-message-id="${message.messageId}"]`);
      if (messageElement) {
        messageElement.style.backgroundColor = settings.highlightColor;
      }
    }, 50); // Small delay to ensure DOM is updated
  }
});

// Add a custom command
window.packbase.emit('command:register', {
  name: 'highlight-add',
  description: 'Add a keyword for highlighting',
  handler: (args) => {
    if (args.length > 0) {
      settings.keywords.push(args[0]);
      return `Added "${args[0]}" to highlight keywords`;
    }
    return 'Please provide a keyword';
  }
});

// Cleanup function for when the plugin is disabled
function cleanup() {
  // Remove all event listeners
  messageListener();

  // Unregister the plugin
  window.packbase.unregisterPlugin(pluginId);
}

// Export cleanup for plugin management
window.plugins = window.plugins || {};
window.plugins.keywordHighlighter = { cleanup };
```

## Submitting Plugins

If you develop a plugin that you think others would find useful, consider submitting it to the Packbase plugin
directory. Ensure your plugin follows all guidelines and includes proper documentation.

---

Happy coding! If you have questions or need assistance, join our developer community or open an issue on our GitHub
repository.
