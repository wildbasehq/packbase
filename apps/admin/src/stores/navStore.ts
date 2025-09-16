import {create} from 'zustand'
import type {ComponentType} from 'react'
import {Fade} from '@carbon/icons-react'

export interface NavItemBase {
    label: string;
    href?: string;
    icon?: ComponentType<any>;
}

export interface NavMenu extends NavItemBase {
    children: NavItemBase[];
}

export type NavEntry = NavItemBase | NavMenu;

interface NavState {
    items: NavEntry[];
    setItems: (items: NavEntry[]) => void;
    addItem: (item: NavEntry) => void;
    reset: () => void;
}

const initialItems: NavEntry[] = [
    {label: 'Link 1', href: '#'},
    {label: 'Link 2', href: '#'},
    {label: 'Link 3', href: '#'},
    {
        label: 'Link 4',
        children: [
            {label: 'Sub-link 1', href: '#one'},
            {label: 'Sub-link 2', href: '#two'},
            {label: 'Sub-link 3', href: '#three'},
        ],
    },
    {
        label: 'Category title',
        icon: Fade,
        children: [
            {label: 'Link 5', href: 'https://www.carbondesignsystem.com/'},
            {label: 'Link 6', href: 'https://www.carbondesignsystem.com/'},
            {label: 'Link 7', href: 'https://www.carbondesignsystem.com/'},
        ],
    },
    {
        label: 'Category title',
        icon: Fade,
        children: [
            {label: 'Link 8', href: 'https://www.carbondesignsystem.com/'},
            {label: 'Link 9', href: 'https://www.carbondesignsystem.com/'},
            {label: 'Link 10', href: 'https://www.carbondesignsystem.com/'},
        ],
    },
    {
        label: 'Category title',
        icon: Fade,
        children: [
            {label: 'Link 11', href: 'https://www.carbondesignsystem.com/'},
            {label: 'Link 12', href: 'https://www.carbondesignsystem.com/'},
            {label: 'Link 13', href: 'https://www.carbondesignsystem.com/'},
        ],
    },
    {label: 'Link', icon: Fade, href: 'https://www.carbondesignsystem.com/'},
    {label: 'Link', icon: Fade, href: 'https://www.carbondesignsystem.com/'},
]

export const useNavStore = create<NavState>((set) => ({
    items: initialItems,
    setItems: (items) => set({items}),
    addItem: (item) => set((state) => ({items: [...state.items, item]})),
    reset: () => set({items: initialItems}),
}))
