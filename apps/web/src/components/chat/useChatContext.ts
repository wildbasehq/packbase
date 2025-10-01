import {create} from 'zustand'
import {subscribeWithSelector} from 'zustand/middleware'

interface ChatState {
    // Message editing state
    editingMessageId: string | null
    editContent: string

    // UI state
    isUserScrolled: boolean
    loadingOlder: boolean
    hasMoreMessages: boolean

    // Actions that don't trigger re-renders in other components
    setEditingMessage: (id: string | null, content: string) => void
    setEditContent: (content: string) => void
    setUserScrolled: (scrolled: boolean) => void
    setLoadingOlder: (loading: boolean) => void
    setHasMoreMessages: (hasMore: boolean) => void

    // Clear all editing state
    cancelEdit: () => void
}

export const useChatStore = create<ChatState>()(
    subscribeWithSelector((set) => ({
        // Initial state
        editingMessageId: null,
        editContent: '',
        isUserScrolled: false,
        loadingOlder: false,
        hasMoreMessages: true,

        // Actions
        setEditingMessage: (id, content) =>
            set({editingMessageId: id, editContent: content}),

        setEditContent: (content) =>
            set({editContent: content}),

        setUserScrolled: (scrolled) =>
            set({isUserScrolled: scrolled}),

        setLoadingOlder: (loading) =>
            set({loadingOlder: loading}),

        setHasMoreMessages: (hasMore) =>
            set({hasMoreMessages: hasMore}),

        cancelEdit: () =>
            set({editingMessageId: null, editContent: ''}),
    }))
)

// Selector hooks to prevent unnecessary re-renders

export const useEditingState = () =>
    useChatStore((state) => ({
        editingMessageId: state.editingMessageId,
        editContent: state.editContent,
        setEditingMessage: state.setEditingMessage,
        setEditContent: state.setEditContent,
        cancelEdit: state.cancelEdit,
    }))

export const useScrollState = () =>
    useChatStore((state) => ({
        isUserScrolled: state.isUserScrolled,
        setUserScrolled: state.setUserScrolled,
    }))

export const useLoadingState = () =>
    useChatStore((state) => ({
        loadingOlder: state.loadingOlder,
        hasMoreMessages: state.hasMoreMessages,
        setLoadingOlder: state.setLoadingOlder,
        setHasMoreMessages: state.setHasMoreMessages,
    }))
