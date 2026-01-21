type CurrencyType = 'trinket' | 'xp';

export class TrinketManager {
    type: CurrencyType = 'trinket'

    constructor(type?: CurrencyType) {
        this.type = type ?? 'trinket'
    }

    async getBalance(parentId: string, minValue: number = 0): Promise<number> {
        const row = await prisma.currency.findUnique({
            where: {parent_id: parentId, type: this.type},
            select: {amount: true},
        })
        return Math.max(row?.amount ?? 0, minValue)
    }

    async setBalance(parentId: string, amount: number): Promise<number> {
        if (!Number.isInteger(amount) || amount < 0) {
            throw new Error('amount must be a non-negative integer')
        }
        const now = new Date()
        const row = await prisma.currency.upsert({
            where: {parent_id: parentId, type: this.type},
            update: {amount, updated_at: now},
            create: {parent_id: parentId, type: this.type, amount, created_at: now, updated_at: now},
            select: {amount: true},
        })

        await prisma.admin_audit_log.create({
            data: {
                user_id: parentId.split(':')[1],
                action: 'TRINKET_BALANCE_SET_OK',
                model_type: 'currency',
                model_id: parentId,
                model_object: {amount},
            },
        })
        return row.amount
    }

    async increment(parentId: string, delta: number = 1): Promise<number> {
        if (!Number.isInteger(delta) || delta < 0) throw new Error('delta must be a non-negative integer')
        if (delta === 0) return this.getBalance(parentId)
        const now = new Date()
        return await prisma.$transaction(async (tx) => {
            const existing = await tx.currency.findUnique({where: {parent_id: parentId, type: this.type}, select: {amount: true}})
            const amount = (existing?.amount ?? 0) + delta
            const saved = await tx.currency.upsert({
                where: {parent_id: parentId},
                update: {amount, type: this.type, updated_at: now},
                create: {parent_id: parentId, type: this.type, amount, created_at: now, updated_at: now},
                select: {amount: true},
            })

            await prisma.admin_audit_log.create({
                data: {
                    user_id: parentId.split(':')[1],
                    action: 'TRINKET_BALANCE_CHANGED_OK',
                    model_type: 'currency',
                    model_id: parentId,
                    model_object: {amount, gained: delta},
                },
            })

            return saved.amount
        })
    }

    async decrement(parentId: string, delta: number = 1): Promise<number> {
        if (!Number.isInteger(delta) || delta < 0) throw new Error('delta must be a non-negative integer')
        if (delta === 0) return this.getBalance(parentId)
        const now = new Date()
        return prisma.$transaction(async (tx) => {
            const existing = await tx.currency.findUnique({where: {parent_id: parentId, type: this.type}, select: {amount: true}})
            const current = existing?.amount ?? 0
            if (current < delta) throw new Error('insufficient trinkets')
            const saved = await tx.currency.update({
                where: {parent_id: parentId},
                data: {amount: current - delta, updated_at: now},
                select: {amount: true},
            })

            await prisma.admin_audit_log.create({
                data: {
                    user_id: parentId.split(':')[1],
                    action: 'TRINKET_BALANCE_CHANGED_OK',
                    model_type: 'currency',
                    model_id: parentId,
                    model_object: {amount: saved.amount, spent: delta},
                },
            })

            return saved.amount
        })
    }

    async transfer(fromParentId: string, toParentId: string, amount: number): Promise<{ from: number; to: number }> {
        if (!Number.isInteger(amount) || amount <= 0) throw new Error('amount must be a positive integer')
        if (fromParentId === toParentId) throw new Error('cannot transfer to same parent')
        const now = new Date()
        return prisma.$transaction(async (tx) => {
            const fromRow = await tx.currency.findUnique({where: {parent_id: fromParentId, type: this.type}, select: {amount: true}})
            const fromBalance = fromRow?.amount ?? 0
            if (fromBalance < amount) throw new Error('insufficient trinkets')

            const newFrom = fromBalance - amount
            await tx.currency.update({where: {parent_id: fromParentId}, data: {amount: newFrom, type: this.type, updated_at: now}})

            const toRow = await tx.currency.findUnique({where: {parent_id: toParentId, type: this.type}, select: {amount: true}})
            const newTo = (toRow?.amount ?? 0) + amount
            await tx.currency.upsert({
                where: {parent_id: toParentId},
                update: {amount: newTo, type: this.type, updated_at: now},
                create: {parent_id: toParentId, type: this.type, amount: newTo, created_at: now, updated_at: now},
            })

            await prisma.admin_audit_log.create({
                data: {
                    user_id: fromParentId,
                    action: 'TRINKET_BALANCE_TRANSFER_OK',
                    model_type: 'currency',
                    model_id: fromParentId,
                    model_object: {
                        from: newFrom,
                        to: newTo,
                        amount,
                    },
                },
            })

            return {from: newFrom, to: newTo}
        })
    }
}

const trinketManager = new TrinketManager()
const xpManager = new TrinketManager('xp')

export {trinketManager, xpManager}
