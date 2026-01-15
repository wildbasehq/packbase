# Settings Manager

A type-safe settings manager for handling getters and setters for settings stored in the Prisma database.

## Features

- ✅ **Type-safe**: Full TypeScript support with inferred types from schemas
- ✅ **Schema-based**: Settings defined in JSON schema files
- ✅ **Database-backed**: Automatically syncs with Prisma database
- ✅ **Audit logging**: Optional audit trail for setting changes
- ✅ **Caching**: Built-in caching for performance
- ✅ **Validation**: Automatic value validation based on schema

## Usage

### Basic Usage

```typescript
import {Settings} from './lib/settings';

// Create a settings instance for user settings
const userSettings = new Settings('user', {
    modelId: 'user-123',
    cache: true,
});

// Wait for initialization (started in constructor)
await userSettings.waitForInit();

// Get a setting (synchronous)
const privacy = userSettings.get('post_privacy');
console.log(privacy); // 'everyone'

// Set a setting (async)
await userSettings.set('post_privacy', 'friends');

// Get all settings (synchronous)
const allSettings = userSettings.getAll();
console.log(allSettings);
// { post_privacy: 'friends', show_nsfw: false }
```

### With Audit Logging

```typescript
const settings = new Settings('user', {
    auditLog: true,
    userId: 'admin-123',
    internal: false,
});

await settings.init('profile-id');
await settings.set('show_nsfw', true);

// View audit logs
const logs = settings.getAuditLogs();
console.log(logs);
```

### Bulk Operations

```typescript
// Set multiple settings at once
await settings.setMany({
    post_privacy: 'followers',
    show_nsfw: true,
});

// Reset a setting to default
await settings.reset('post_privacy');

// Reset all settings
await settings.resetAll();
```

### Schema Information

```typescript
// Get definition for a specific setting
const def = settings.getDefinition('post_privacy');
console.log(def);
// {
//   type: 'string',
//   values: ['everyone', 'followers', 'friends'],
//   default: 'everyone',
//   ...
// }

// Get the entire schema
const schema = settings.getSchema();
```

### Factory Function

```typescript
import {createSettings} from './lib/settings';

const settings = createSettings('user', {
    userId: 'user-123',
});
```

## Creating Schemas

Schemas are JSON files in `./schemas/` that define the settings structure.

### Schema Format

```json
{
  "model": "profiles",
  "version": "1.0.0",
  "settings": {
    "setting_key": {
      "type": "string",
      "values": [
        "option1",
        "option2"
      ],
      "default": "option1",
      "userModifiable": true,
      "description": "Description of the setting",
      "category": "category_name",
      "db": "model_name.field_name"
    }
  }
}
```

### Field Descriptions

- **model**: The Prisma model name this schema relates to
- **version**: Schema version for migration tracking
- **settings**: Object containing all setting definitions
    - **type**: Data type (`string`, `boolean`, `number`, `object`, `array`)
    - **values**: Array of allowed values (for string enums)
    - **default**: Default value if not set in database
    - **userModifiable**: Whether users can modify this setting
    - **description**: Human-readable description
    - **category**: Grouping category
    - **db**: Database location in format `model.field`

### Example Schema

See [schemas/user.json](./schemas/user.json) for a complete example.

## Options

### SettingsOptions

```typescript
interface SettingsOptions {
    /** Enable audit logging for setting changes */
    auditLog?: boolean;
    /** User ID for audit trail (optional) */
    userId?: string;
    /** Whether changes are internal (not user-initiated) */
    internal?: boolean;
    /** Cache settings in memory (default: true) */
    cache?: boolean;
}
```

## API Reference

### Constructor

```typescript
new Settings<SchemaName>(schemaName
:
string, options ? : SettingsOptions
)
```

### Methods

- `async waitForInit(): Promise<void>` - Wait for initialization to complete (started in constructor)
- `async init(modelId: string): Promise<void>` - Initialize or re-initialize with a model instance ID
- `get<K>(key: K): any` - Get a setting value (synchronous)
- `async set<K>(key: K, value: any): Promise<void>` - Set a setting value
- `getAll(): Record<string, any>` - Get all settings (synchronous)
- `async setMany(settings: Partial<Record<string, any>>): Promise<void>` - Set multiple settings
- `async reset<K>(key: K): Promise<void>` - Reset setting to default
- `async resetAll(): Promise<void>` - Reset all settings to defaults
- `getDefinition<K>(key: K): SettingDefinition` - Get schema definition for a setting
- `getSchema(): SchemaDefinition` - Get the complete schema
- `getAuditLogs(): AuditLog[]` - Get audit logs (if enabled)
- `clearCache(): void` - Clear the internal cache

## Error Handling

The Settings class throws errors for:

- Invalid schema files
- Unknown setting keys
- Type mismatches
- Invalid enum values
- Uninitialized usage (calling methods before `init()`)

```typescript
try {
    await settings.set('post_privacy', 'invalid_value');
} catch (error) {
    console.error(error.message);
    // "Invalid value for setting 'post_privacy': must be one of [everyone, followers, friends]"
}
```
