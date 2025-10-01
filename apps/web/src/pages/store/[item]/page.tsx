/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {useState} from 'react'
import {vg} from '@/lib/api'
import {Alert, AlertDescription, AlertTitle} from '@/components/shared/alert'
import {Button} from '@/components/shared'
import {Text} from '@/components/shared/text'

type StoreItem = {
    id: string
    title: string
    description?: string
    type: string
    price: number
    stackable: boolean
    maxQuantity?: number
}

export default function StoreItemModal({
                                           item,
                                           trinkets,
                                           onPurchaseSuccess,
                                       }: {
    item: StoreItem
    trinkets: number
    onPurchaseSuccess: () => void
}) {
    const [owned, setOwned] = useState<number>(0)
    const [quantity, setQuantity] = useState<number>(1)
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    if (!item) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Item not found</AlertTitle>
                <AlertDescription>We couldn't find that store item.</AlertDescription>
            </Alert>
        )
    }

    const canSetQuantity = item.stackable
    const finalQuantity = canSetQuantity ? quantity : 1

    const onPurchase = async () => {
        setLoading(true)
        setError(null)
        setSuccess(null)

        const res = await vg.store({item: item.id}).post({quantity: finalQuantity})
        if (res.error) {
            throw new Error(res.error.summary || 'Purchase failed')
        }
        
        setOwned(res.inventory?.amount || owned + finalQuantity)
        setSuccess('Purchased successfully!')
        onPurchaseSuccess()

        setLoading(false)
    }

    return (
        <div className="space-y-4">
            <div>
                <Text alt>You sure you want to buy this item? This cannot be undone.</Text>

                <div className="flex items-center mt-4 gap-6">
                    <Text size="lg" className="font-bold">
                        {item.price} trinkets
                    </Text>
                    <Text alt>Owned: {owned}</Text>
                </div>
            </div>

            {canSetQuantity && (
                <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground">Quantity</label>
                    <input
                        type="number"
                        min={1}
                        max={item.maxQuantity || undefined}
                        value={quantity}
                        onChange={e => setQuantity(Math.max(1, Math.min(item.maxQuantity || Infinity, parseInt(e.target.value || '1'))))}
                        className="px-2 py-1 rounded border bg-card w-24"
                    />
                    {item.maxQuantity && <div className="text-xs text-muted-foreground">Max {item.maxQuantity}</div>}
                </div>
            )}

            <div className="flex gap-2 flex-col">
                {trinkets < item.price && (
                    <div>
                        <Text alt className="!text-destructive">
                            Can't afford this item!
                        </Text>
                        <Text alt size="xs" className="italic">
                            {/* Calc based on invites giving 5 trinkets each */}
                            You're T${item.price - trinkets} short. That's
                            about {Math.ceil((item.price - trinkets) / 5)} invite(s).
                        </Text>
                    </div>
                )}

                {trinkets >= item.price && (
                    <>
                        <Text alt size="xs" className="italic">
                            You'll have {trinkets - item.price} trinkets afterwards. It will be automatically set as
                            your active badge.
                        </Text>
                        <Button color="indigo" onClick={onPurchase} disabled={loading}>
                            {loading ? 'Purchasing…' : 'Buy'}
                        </Button>
                    </>
                )}
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertTitle>Purchase failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {success && (
                <Alert variant="success">
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>{success}</AlertDescription>
                </Alert>
            )}
        </div>
    )
}
