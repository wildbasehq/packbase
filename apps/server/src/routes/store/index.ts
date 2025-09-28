import { t } from 'elysia';
import { YapockType } from '@/index';
import requiresToken from '@/utils/identity/requires-token';
import StoreManager from '@/lib/StoreManager';
import Items from '@/lib/store/items.json';
import trinketManager from '@/utils/trinket-manager';

const store = new StoreManager();

export default (app: YapockType) =>
    app
        .get(
            '',
            async ({ user, set }) => {
                requiresToken({ set, user });
                const items = await store.listWithOwnership(user.sub);
                const trinketCount = await trinketManager.getBalance(`user:${user.sub}`);
                const history = await prisma.admin_audit_log.findMany({
                    where: {
                        user_id: user.sub,
                        action: {
                            in: ['TRINKET_PURCHASE_OK', 'TRINKET_BALANCE_CHANGED_OK', 'TRINKET_BALANCE_TRANSFER_OK'],
                        },
                    },
                });

                return {
                    items,
                    trinketCount,
                    history,
                };
            },
            {
                detail: {
                    description: 'List store items with ownership info for current user.',
                    tags: ['Store'],
                },
                response: t.Object({
                    trinketCount: t.Number(),
                    items: t.Array(
                        t.Object({
                            id: t.String(),
                            title: t.String(),
                            description: t.Optional(t.String()),
                            type: t.String(),
                            price: t.Number(),
                            stackable: t.Boolean(),
                            maxQuantity: t.Optional(t.Number()),
                            ownedAmount: t.Number(),
                        }),
                    ),
                    history: t.Array(
                        t.Object({
                            id: t.String(),
                            action: t.String(),
                            model_object: t.Any(),
                        }),
                    ),
                }),
            },
        )
        .get(
            '/catalog',
            async () => {
                return { items: Object.values(Items) };
            },
            {
                detail: {
                    description: 'List all available store items (catalog).',
                    tags: ['Store'],
                },
                response: t.Object({
                    items: t.Array(
                        t.Object({
                            id: t.String(),
                            title: t.String(),
                            description: t.Optional(t.String()),
                            type: t.String(),
                            price: t.Number(),
                            stackable: t.Boolean(),
                            maxQuantity: t.Optional(t.Number()),
                        }),
                    ),
                }),
            },
        );
