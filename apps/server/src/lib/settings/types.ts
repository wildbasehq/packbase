export type SettingType = 'string' | 'boolean' | 'number' | 'array' | 'object';

export type ConditionOperator = 'equals' | 'notEquals' | 'in' | 'notIn' | 'greaterThan' | 'lessThan' | 'exists' | 'notExists';

export interface Condition {
    field: string;
    operator: ConditionOperator;
    value?: any;
}

export interface LogicalCondition {
    and?: Condition[];
    or?: Condition[];
}

export type AccessCondition = Condition | LogicalCondition;

export interface SettingDefinition {
    type: SettingType;
    values?: any[];
    default?: any;
    userModifiable: boolean;
    condition?: AccessCondition;
    description?: string;
    category?: string;
    db: string;
}

export interface SettingSchema {
    model: string;
    settings: Record<string, SettingDefinition>;
    version?: string;
    extends?: string;
}

export interface ValidationError {
    field: string;
    message: string;
    code: string;
}

export interface ValidationResult {
    success: boolean;
    errors: ValidationError[];
    warnings?: string[];
}

export interface SettingValue {
    key: string;
    value: any;
    definition: SettingDefinition;
    accessible: boolean;
    modifiable: boolean;
}

export interface SettingUpdate {
    key: string;
    value: any;
    previousValue?: any;
}

export interface AuditLog {
    timestamp: Date;
    modelType: string;
    modelId: string;
    modelObject: any;
    settingKey: string;
    oldValue: any;
    newValue: any;
    userId?: string;
    internal: boolean;
}

export interface SettingsOptions {
    enableAuditLogging?: boolean;
    cacheSchemas?: boolean;
    strictValidation?: boolean;
    allowSchemaInheritance?: boolean;
    cacheExpirationMs?: number;
    schemasPath?: string;
}

export interface CachedSettingValue {
    value: any;
    timestamp: number;
    expiresAt: number;
}
