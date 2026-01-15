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
