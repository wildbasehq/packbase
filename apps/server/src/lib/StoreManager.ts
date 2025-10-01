import prisma from '@/db/prisma';
import trinketManager, {toParentId} from '@/utils/trinket-manager';
import {HTTPError} from '@/lib/HTTPError';
import Items from '@/lib/store/items.json';
import debug from "debug";

const log = {
    info: debug('vg:trinket'),
    error: debug('vg:trinket:error'),
    warn: debug('vg:trinket:warn'),
}

export type StoreItemId = keyof typeof Items;

export interface StoreItem {
    id: string;
    title: string;
    description?: string;
    type: 'item' | 'badge' | string;
    price: number; // in trinkets, per unit
    stackable: boolean;
    maxQuantity?: number; // optional cap for stackable items
}

export interface PurchaseResult {
    item: StoreItem;
    quantity: number;
    newTrinketBalance: number;
    inventory: {
        item_id: string;
        amount: number;
        type: string;
    };
}

export default class StoreManager {
    listItems(): StoreItem[] {
        return Object.values(Items) as StoreItem[];
    }

    getItem(itemId: string): StoreItem | undefined {
        return (Items as Record<string, StoreItem>)[itemId];
    }

    async listWithOwnership(userId: string): Promise<(StoreItem & { ownedAmount: number })[]> {
        const items = this.listItems();
        const rows = await prisma.inventory.findMany({
            where: {user_id: userId, item_id: {in: items.map((i) => i.id)}},
            select: {item_id: true, amount: true},
        });
        const ownedMap = new Map(rows.map((r) => [r.item_id, r.amount] as const));
        return items.map((i) => ({...i, ownedAmount: ownedMap.get(i.id) ?? 0}));
    }

    async purchase(userId: string, itemId: string, quantity: number = 1): Promise<PurchaseResult> {
        const item = this.getItem(itemId);
        if (!item) {
            throw HTTPError.notFound({summary: 'ITEM_NOT_FOUND'});
        }
        if (!Number.isInteger(quantity) || quantity <= 0) {
            throw HTTPError.badRequest({summary: 'INVALID_QUANTITY'});
        }
        if (item.stackable === false && quantity !== 1) {
            throw HTTPError.badRequest({summary: 'NOT_STACKABLE'});
        }
        if (item.stackable && item.maxQuantity && quantity > item.maxQuantity) {
            throw HTTPError.badRequest({summary: 'QUANTITY_EXCEEDS_MAX'});
        }

        // Validate ownership for one-time purchases before charging
        const existing = await prisma.inventory.findUnique({
            where: {item_id_user_id: {item_id: item.id, user_id: userId}},
            select: {amount: true},
        });

        if (!item.stackable && existing) {
            throw HTTPError.conflict({summary: 'ALREADY_OWNED'});
        }

        // Calculate cost and charge trinkets first
        const totalCost = item.price * quantity;
        if (!Number.isInteger(totalCost) || totalCost < 0) {
            throw HTTPError.serverError({summary: 'INVALID_PRICE'});
        }

        const parentId = toParentId('user', userId);

        // Charge using TrinketManager, then update inventory.
        // If inventory update fails, attempt a best-effort refund.
        let newTrinketBalance = 0;
        try {
            newTrinketBalance = await trinketManager.decrement(parentId, totalCost);
        } catch (e: any) {
            if (e?.message === 'insufficient trinkets') {
                throw HTTPError.forbidden({summary: 'INSUFFICIENT_TRINKETS'});
            }
            console.error(e);
            throw HTTPError.serverError({summary: 'FAILED_TO_CHARGE'});
        }

        try {
            const updated = await prisma.inventory.upsert({
                where: {item_id_user_id: {item_id: item.id, user_id: userId}},
                update: {
                    amount: item.stackable ? (existing?.amount ?? 0) + quantity : 1,
                    type: item.type,
                },
                create: {
                    user_id: userId,
                    item_id: item.id,
                    amount: item.stackable ? quantity : 1,
                    type: item.type,
                },
                select: {item_id: true, amount: true, type: true},
            });

            // Set is_set to true if the item is a badge, only to this item. Sets all other badges to false.
            if (item.type === 'badge') {
                await prisma.inventory.updateMany({
                    where: {user_id: userId, type: 'badge'},
                    data: {is_set: false},
                });
                await prisma.inventory.update({
                    where: {item_id_user_id: {item_id: item.id, user_id: userId}},
                    data: {is_set: true},
                });
            }

            // Enforce maxQuantity on total amount if defined
            if (item.stackable && item.maxQuantity && updated.amount > item.maxQuantity) {
                await prisma.inventory.update({
                    where: {item_id_user_id: {item_id: item.id, user_id: userId}},
                    data: {amount: item.maxQuantity},
                });
                updated.amount = item.maxQuantity;
            }

            await prisma.admin_audit_log.create({
                data: {
                    user_id: userId,
                    action: 'INVENTORY_PURCHASE_OK',
                    model_type: 'inventory',
                    model_id: item.id,
                    model_object: {amount: updated.amount, quantity},
                },
            });

            return {
                item,
                quantity,
                newTrinketBalance,
                inventory: updated,
            };
        } catch (e) {
            // Best-effort refund
            try {
                await trinketManager.increment(parentId, totalCost);
            } catch (_) {
                log.error('Failed to refund trinkets after purchase failure');
            }
            throw HTTPError.serverError({summary: 'FAILED_TO_DELIVER'});
        }
    }
}
