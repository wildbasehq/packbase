/**
 * Database adapter interface for persisting settings
 */
export interface DatabaseAdapter {
    /**
     * Updates a setting value in the database
     */
    updateSetting(table: string, column: string, value: any, whereCondition: Record<string, any>): Promise<void>;

    /**
     * Retrieves a setting value from the database
     */
    getSetting(table: string, column: string, whereCondition: Record<string, any>): Promise<any>;
}

export class PrismaDatabaseAdapter implements DatabaseAdapter {
    constructor(private prisma: any) {}

    async updateSetting(table: string, column: string, value: any, whereCondition: Record<string, any>): Promise<void> {
        await this.prisma[table].update({
            where: whereCondition,
            data: { [column]: value },
        });
    }

    async getSetting(table: string, column: string, whereCondition: Record<string, any>): Promise<any> {
        const result = await this.prisma[table].findUnique({
            where: whereCondition,
            select: { [column]: true },
        });
        return result?.[column];
    }
}
