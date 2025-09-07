# Settings Management System

A comprehensive TypeScript settings management system that provides type-safe, validated, and conditional access control for application settings.

## Features

- **Schema-based**: Define settings using JSON schemas with validation rules
- **Conditional access**: Settings can be conditionally available based on model properties
- **Type safety**: Full TypeScript support with generics
- **Validation**: Automatic value validation and sanitization
- **Audit logging**: Track all setting changes with timestamps
- **Permission control**: Distinguish between user-modifiable and internal-only settings
- **Schema inheritance**: Support for extending schemas from parent models

## Quick Start

```typescript
import { Settings } from './settings';

// Initialize settings system
const settings = new Settings({
  enableAuditLogging: true,
  cacheSchemas: true,
  strictValidation: true
});

// Example user object
const user = {
  id: 'user123',
  type: 'user',
  emailVerified: true,
  accountStatus: 'active'
};

// Get a setting value
const theme = await settings.getSetting(user, 'theme');

// Update a setting
await settings.updateSetting(user, 'theme', 'dark');

// Batch update multiple settings
await settings.updateSettings(user, {
  theme: 'light',
  emailNotifications: true
});

// Get user-modifiable settings only
const userSettings = await settings.getUserSettings(user);
```

## Schema Structure

Schemas are defined as JSON files in the `schemas/` directory:

```json
{
  "model": "user",
  "version": "1.0.0",
  "settings": {
    "theme": {
      "type": "string",
      "values": ["light", "dark", "auto"],
      "default": "auto",
      "userModifiable": true,
      "description": "UI theme preference"
    },
    "emailNotifications": {
      "type": "boolean",
      "default": true,
      "userModifiable": true,
      "condition": {
        "field": "emailVerified",
        "operator": "equals",
        "value": true
      }
    }
  }
}
```

## Conditional Access

Settings can have conditions that determine when they're accessible:

```json
{
  "condition": {
    "and": [
      {
        "field": "accountStatus",
        "operator": "equals",
        "value": "active"
      },
      {
        "field": "premiumUser",
        "operator": "equals",
        "value": true
      }
    ]
  }
}
```

Supported operators:
- `equals`, `notEquals`
- `in`, `notIn`
- `greaterThan`, `lessThan`
- `exists`, `notExists`

## API Reference

### Settings Class

#### Constructor
```typescript
new Settings(options?: SettingsOptions)
```

#### Methods

**loadSettings(modelObject)** - Load all accessible settings for a model
**getSetting(modelObject, key)** - Get a specific setting value
**updateSetting(modelObject, key, value, internal?)** - Update a single setting
**updateSettings(modelObject, updates, internal?)** - Batch update settings
**getUserSettings(modelObject)** - Get only user-modifiable settings
**setInternalSetting(modelObject, key, value)** - Internal-only setting update
**getAuditLogs(modelType?, modelId?)** - Retrieve audit logs

## Testing

Run the test suite:
```bash
bun test src/lib/settings/__tests__/settings.test.ts
```

## Directory Structure

```
settings/
├── index.ts           # Main Settings class
├── types.ts           # TypeScript interfaces
├── validators.ts      # Value validation logic
├── conditions.ts      # Conditional access evaluator
├── schemas/           # JSON schema files
│   ├── user.json
│   ├── organization.json
│   └── project.json
└── __tests__/
    └── settings.test.ts
```