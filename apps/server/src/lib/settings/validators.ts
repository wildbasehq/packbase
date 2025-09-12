import type { SettingDefinition, ValidationError, ValidationResult, SettingType } from './types';

export class SettingValidator {
    /**
     * Validates a single setting value against its definition
     */
    static validateSetting(key: string, value: any, definition: SettingDefinition): ValidationResult {
        const errors: ValidationError[] = [];

        // Check if value is required
        if (value === undefined || value === null) {
            if (definition.default === undefined) {
                errors.push({
                    field: key,
                    message: `Setting "${key}" is required`,
                    code: 'REQUIRED',
                });
            }
            return { success: errors.length === 0, errors };
        }

        // Type validation
        const typeError = this.validateType(key, value, definition.type);
        if (typeError) {
            errors.push(typeError);
        }

        // Value constraints validation
        if (definition.values && definition.values.length > 0) {
            const valueError = this.validateAllowedValues(key, value, definition.values);
            if (valueError) {
                errors.push(valueError);
            }
        }

        // Custom validation for specific types
        const customError = this.validateCustomConstraints(key, value, definition);
        if (customError) {
            errors.push(customError);
        }

        return {
            success: errors.length === 0,
            errors,
        };
    }

    /**
     * Validates multiple settings at once
     */
    static validateSettings(updates: Record<string, any>, definitions: Record<string, SettingDefinition>): ValidationResult {
        const allErrors: ValidationError[] = [];
        const warnings: string[] = [];

        for (const [key, value] of Object.entries(updates)) {
            const definition = definitions[key];

            if (!definition) {
                allErrors.push({
                    field: key,
                    message: `Unknown setting "${key}"`,
                    code: 'UNKNOWN_SETTING',
                });
                continue;
            }

            const result = this.validateSetting(key, value, definition);
            allErrors.push(...result.errors);
        }

        // Check for missing required settings
        for (const [key, definition] of Object.entries(definitions)) {
            if (!(key in updates) && definition.default === undefined) {
                warnings.push(`Setting "${key}" not provided, no default available`);
            }
        }

        return {
            success: allErrors.length === 0,
            errors: allErrors,
            warnings,
        };
    }

    /**
     * Validates the type of a setting value
     */
    private static validateType(key: string, value: any, expectedType: SettingType): ValidationError | null {
        const actualType = this.getValueType(value);

        if (actualType !== expectedType) {
            return {
                field: key,
                message: `Setting "${key}" must be of type ${expectedType}, got ${actualType}`,
                code: 'INVALID_TYPE',
            };
        }

        return null;
    }

    /**
     * Validates that a value is in the allowed values list
     */
    private static validateAllowedValues(key: string, value: any, allowedValues: any[]): ValidationError | null {
        if (!allowedValues.includes(value)) {
            return {
                field: key,
                message: `Setting "${key}" must be one of: ${allowedValues.join(', ')}`,
                code: 'INVALID_VALUE',
            };
        }

        return null;
    }

    /**
     * Validates custom constraints based on the setting definition
     */
    private static validateCustomConstraints(key: string, value: any, definition: SettingDefinition): ValidationError | null {
        // String length validation (if it's a string type)
        if (definition.type === 'string' && typeof value === 'string') {
            if (value.length === 0) {
                return {
                    field: key,
                    message: `Setting "${key}" cannot be empty`,
                    code: 'EMPTY_STRING',
                };
            }

            // Reasonable length limit for strings
            if (value.length > 1000) {
                return {
                    field: key,
                    message: `Setting "${key}" is too long (max 1000 characters)`,
                    code: 'STRING_TOO_LONG',
                };
            }
        }

        // Number range validation
        if (definition.type === 'number' && typeof value === 'number') {
            if (!Number.isFinite(value)) {
                return {
                    field: key,
                    message: `Setting "${key}" must be a finite number`,
                    code: 'INVALID_NUMBER',
                };
            }
        }

        // Array validation
        if (definition.type === 'array' && Array.isArray(value)) {
            if (value.length > 100) {
                return {
                    field: key,
                    message: `Setting "${key}" array is too large (max 100 items)`,
                    code: 'ARRAY_TOO_LARGE',
                };
            }
        }

        // Object validation
        if (definition.type === 'object' && typeof value === 'object' && value !== null) {
            try {
                JSON.stringify(value);
            } catch {
                return {
                    field: key,
                    message: `Setting "${key}" contains non-serializable values`,
                    code: 'NON_SERIALIZABLE',
                };
            }

            const size = JSON.stringify(value).length;
            if (size > 10000) {
                return {
                    field: key,
                    message: `Setting "${key}" object is too large (max 10KB)`,
                    code: 'OBJECT_TOO_LARGE',
                };
            }
        }

        return null;
    }

    /**
     * Gets the runtime type of a value
     */
    private static getValueType(value: any): SettingType {
        if (value === null || value === undefined) {
            return 'object';
        }

        if (Array.isArray(value)) {
            return 'array';
        }

        const type = typeof value;

        if (type === 'string' || type === 'boolean' || type === 'number') {
            return type;
        }

        return 'object';
    }

    /**
     * Sanitizes a value based on its type and definition
     */
    static sanitizeValue(value: any, definition: SettingDefinition): any {
        if (value === undefined || value === null) {
            return definition.default;
        }

        switch (definition.type) {
            case 'string':
                return String(value).trim();

            case 'number':
                const num = Number(value);
                return Number.isFinite(num) ? num : definition.default;

            case 'boolean':
                if (typeof value === 'boolean') return value;
                if (typeof value === 'string') {
                    const lower = value.toLowerCase();
                    if (lower === 'true' || lower === '1') return true;
                    if (lower === 'false' || lower === '0') return false;
                }
                return definition.default;

            case 'array':
                return Array.isArray(value) ? value : definition.default;

            case 'object':
                return typeof value === 'object' && value !== null && !Array.isArray(value) ? value : definition.default;

            default:
                return value;
        }
    }

    /**
     * Validates a setting schema definition
     */
    static validateSettingDefinition(key: string, definition: SettingDefinition): ValidationError[] {
        const errors: ValidationError[] = [];

        // Required fields
        if (!definition.type) {
            errors.push({
                field: key,
                message: `Setting definition "${key}" must have a type`,
                code: 'MISSING_TYPE',
            });
        }

        // if (definition.default === undefined) {
        //   errors.push({
        //     field: key,
        //     message: `Setting definition "${key}" must have a default value`,
        //     code: 'MISSING_DEFAULT'
        //   });
        // }

        if (typeof definition.userModifiable !== 'boolean') {
            errors.push({
                field: key,
                message: `Setting definition "${key}" must specify userModifiable as boolean`,
                code: 'MISSING_USER_MODIFIABLE',
            });
        }

        // Type-specific validation
        if (definition.type && definition.default !== undefined) {
            const typeError = this.validateType(key, definition.default, definition.type);
            if (typeError) {
                errors.push({
                    field: key,
                    message: `Default value for "${key}" doesn't match specified type`,
                    code: 'INVALID_DEFAULT_TYPE',
                });
            }
        }

        // Values constraint validation
        if (definition.values && definition.default !== undefined) {
            if (!definition.values.includes(definition.default)) {
                errors.push({
                    field: key,
                    message: `Default value for "${key}" must be in allowed values`,
                    code: 'INVALID_DEFAULT_VALUE',
                });
            }
        }

        return errors;
    }
}
