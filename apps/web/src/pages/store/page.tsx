/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {useCallback, useEffect, useMemo, useState} from 'react'
import {vg} from '@/lib/api'
import Categories from './categories.json'
import {Alert, AlertDescription, AlertTitle} from '@/components/shared/alert'
import {
    BubblePopover,
    Button,
    Divider,
    Heading,
    SidebarDivider,
    SidebarHeading,
    SidebarItem,
    SidebarLabel,
    SidebarSection
} from '@/components/shared'
import {SidebarPortal} from '@/lib/context/sidebar-context'
import {Text} from '@/components/shared/text'
import {BentoGenericUnlockableBadge} from '@/src/lib/utils/pak'
import {
    ArrowPathIcon,
    ArrowTrendingDownIcon,
    ArrowTrendingUpIcon,
    QuestionMarkCircleIcon,
    ShoppingBagIcon,
} from '@heroicons/react/20/solid'
import {useResourceStore} from '@/src/lib'
import {toast} from 'sonner'
import StoreItemModal from "@/pages/store/[item]/page.tsx";

type StoreItem = {
    id: string
    title: string
    description?: string
    type: string
    price: number
    stackable: boolean
    maxQuantity?: number
}

type OwnedItem = StoreItem & { ownedAmount: number }

export default function StorePage() {
    const [items, setItems] = useState<OwnedItem[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<number>(0)
    const [trinketCount, setTrinketCount] = useState<number>(0)
    const {setCurrentResource} = useResourceStore()

    const categoryKeys = useMemo(() => Object.keys(Categories), [])
    const activeCategory = categoryKeys[activeTab]
    const [history, setHistory] = useState<any[]>([])

    useEffect(() => {
        setCurrentResource({
            id: 'store',
            display_name: 'Trinket Exchange',
        })

        document.title = 'Packbase • Store'

        setLoading(true)
        vg.store
            .get()
            .then(({data}) => {
                setItems(data.items || [])
                setTrinketCount(data.trinketCount || 0)
                setError(null)
                setHistory(data.history || [])
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false))
    }, [])

    const filteredItems = useMemo(() => {
        const ids = new Set((Categories as any)[activeCategory]?.items || [])
        if (ids.size === 0) return items
        return items.filter(i => ids.has(i.id))
    }, [items, activeCategory])

    const canBuyItem = useCallback((item: OwnedItem) => {
        if (item.maxQuantity === 1) return true
        if (!item.maxQuantity) return !item.ownedAmount
        return item.ownedAmount > 0
    }, [])

    return (
        <div className="space-y-6">
            <SidebarPortal>
                <SidebarSection>
                    {categoryKeys.map(category => (
                        <SidebarItem
                            onClick={() => setActiveTab(categoryKeys.indexOf(category))}
                            current={activeTab === categoryKeys.indexOf(category)}
                        >
                            <ShoppingBagIcon/>
                            <div className="flex flex-col min-w-0">
                                <SidebarLabel>{category.toTitleCase()}</SidebarLabel>
                            </div>
                        </SidebarItem>
                    ))}
                </SidebarSection>
                <SidebarDivider/>
                <SidebarSection>
                    <SidebarHeading>History</SidebarHeading>
                    {history.map(h => (
                        <SidebarItem key={h.id} disabled>
                            {h.action === 'TRINKET_PURCHASE_OK' && <ArrowTrendingUpIcon/>}
                            {h.action === 'TRINKET_BALANCE_CHANGED_OK' && <ArrowTrendingDownIcon/>}
                            {h.action === 'TRINKET_BALANCE_TRANSFER_OK' && <ArrowPathIcon/>}
                            <div className="flex flex-col min-w-0">
                                <SidebarLabel>{h.action.toTitleCase()}</SidebarLabel>
                                <SidebarLabel>
                                    {h.model_object.spent ? `-${h.model_object.spent} trinkets` : `+${h.model_object.gained} trinkets`}
                                </SidebarLabel>
                            </div>
                        </SidebarItem>
                    ))}
                </SidebarSection>
            </SidebarPortal>

            {/* "What's a trinket?" */}
            <div className="rounded border bg-card p-4">
                <Heading level={2}>
                    <QuestionMarkCircleIcon className="w-5 -mt-0.5 h-5 inline-flex mr-1" data-slot="icon"/>
                    WTF is a trinket..?
                </Heading>
                <Text>
                    Trinkets (T) is a value-less currency that you can use to buy exclusive items from the store. You
                    can earn trinkets from
                    inviting other users! You can never buy or exchange Trinkets with real money.
                </Text>
                <Divider soft className="my-4"/>
                <Text className="text-red-500 font-bold underline">
                    These badges are only available during the invite-only alpha. You will no longer be able to get
                    these badges after the
                    alpha!!!
                </Text>
            </div>

            {/* Optional header announcement */}
            <Announcement/>

            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Store</h1>
                <div className="text-sm">{trinketCount} Trinkets to spend</div>
            </div>

            {loading && <div className="text-muted-foreground">Loading items…</div>}
            {error && (
                <Alert variant="destructive">
                    <AlertTitle>Failed to load store</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {!loading && !error && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredItems.map(item => (
                        <div key={item.id} className="rounded border bg-card p-4 flex flex-col gap-2">
                            <Text alt>{item.type.toTitleCase()}</Text>
                            {item.type === 'badge' && <BentoGenericUnlockableBadge type={item.id} className="w-18"/>}
                            <div className="flex items-center justify-between">
                                <Text bold size="lg">
                                    {item.title}
                                </Text>
                                <Text alt>{item.price} trinkets</Text>
                            </div>
                            {item.description && <Text alt>{item.description}</Text>}
                            <Text alt size="xs">
                                Owned: {item.ownedAmount}
                            </Text>

                            <div className="flex gap-2 mt-2">
                                {canBuyItem(item) && (
                                    <BubblePopover
                                        id={`store-item-${item.id}`}
                                        trigger={({setOpen}) => (
                                            <Button outline onClick={() => setOpen(true)}>Buy</Button>
                                        )}
                                    >
                                        <div className="max-w-xs">
                                            <StoreItemModal
                                                item={item}
                                                trinkets={trinketCount}
                                                onPurchaseSuccess={() => {
                                                    toast.success('Purchased successfully!')
                                                    setItems(prev =>
                                                        prev.map(i => (i.id === item.id ? {
                                                            ...i,
                                                            ownedAmount: i.ownedAmount + 1
                                                        } : i))
                                                    )
                                                    setTrinketCount(trinketCount - item.price)
                                                }}
                                            />
                                        </div>
                                    </BubblePopover>
                                )}

                                {!canBuyItem(item) && (
                                    <Button
                                        className="w-full"
                                        color="indigo"
                                        onClick={() => {
                                            vg.user.me.badge.post({badge: item.id}).then(({error}) => {
                                                if (error) {
                                                    toast.error(
                                                        error.value ? `${error.status}: ${error.value.summary}` : 'Something went wrong'
                                                    )
                                                } else toast.success('Set as active')
                                            })
                                        }}
                                    >
                                        Set as active
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function Announcement() {
    // Edit this header message or make it dynamic later
    const message = ''
    if (!message) return null
    return (
        <Alert variant="info">
            <AlertTitle>Heads up</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
        </Alert>
    )
}
