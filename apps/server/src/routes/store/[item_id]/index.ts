import {YapockType} from '@/index'
import {HTTPError} from '@/lib/http-error'
import StoreManager from '@/lib/store-manager'
import Items from '@/lib/store/items.json'
import requiresAccount from '@/utils/identity/requires-account'
import {t} from 'elysia'

const store = new StoreManager()

export default (app: YapockType) =>
    app.post(
        '',
        async ({user, set, params, body}) => {
            await requiresAccount({set, user})
            const itemId = params.item_id

            if (!(itemId in Items)) {
                set.status = 404
                throw HTTPError.notFound({summary: 'ITEM_NOT_FOUND'})
            }

            const quantity = body?.quantity ?? 1
            return await store.purchase(user.sub, itemId, quantity)
        },
        {
            params: t.Object({
                item_id: t.String({description: 'ID of the item to purchase'}),
            }),
            body: t.Optional(
                t.Object({
                    quantity: t.Optional(t.Number({default: 1})),
                }),
            ),
            detail: {
                description: 'Purchase an item from the store.',
                tags: ['Store'],
            },
            response: t.Object({
                item: t.Object({
                    id: t.String(),
                    title: t.String(),
                    description: t.Optional(t.String()),
                    type: t.String(),
                    price: t.Number(),
                    stackable: t.Boolean(),
                    maxQuantity: t.Optional(t.Number()),
                }),
                quantity: t.Number(),
                newTrinketBalance: t.Number(),
                inventory: t.Object({
                    item_id: t.String(),
                    amount: t.Number(),
                    type: t.String(),
                }),
            }),
        },
    );
