// ./apps/server/src/lib/settings/audit-logger.ts

import type { AuditLog } from './types';

/**
 * Handles audit logging for setting changes
 */
export class AuditLogger {
    private logs: AuditLog[] = [];
    private maxLogs = 1000;

    constructor(private enabled: boolean) {}

    log(entry: Omit<AuditLog, 'timestamp' | 'modelId'>): void {
        if (!this.enabled) return;

        const modelId = this.extractModelId(entry.modelObject);

        this.logs.push({
            ...entry,
            modelId,
            timestamp: new Date(),
        });

        // Trim old logs
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }
    }

    getLogs(modelType?: string, modelId?: string): AuditLog[] {
        let filtered = this.logs;

        if (modelType) {
            filtered = filtered.filter((log) => log.modelType === modelType);
        }

        if (modelId) {
            filtered = filtered.filter((log) => log.modelId === modelId);
        }

        return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    clear(): void {
        this.logs = [];
    }

    private extractModelId(modelObject: any): string {
        return modelObject.id || modelObject._id || modelObject.userId || `temp_${Date.now()}`;
    }
}
