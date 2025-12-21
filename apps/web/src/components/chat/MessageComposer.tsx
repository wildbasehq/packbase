import { MessageInput } from './MessageInput'
import { useContentFrameMutation } from '@/lib/hooks/content-frame.tsx'
import { useUserAccountStore } from '@/lib'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function MessageComposer({ channelId }: { channelId: string }) {
    const { user: me } = useUserAccountStore()
    const queryClient = useQueryClient()

    const sendMessage = useContentFrameMutation('post', `dm/channels/${channelId}/messages`, {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`messages-${channelId}`] })
        },
        onError: () => {
            toast.error('Failed to send message')
        },
    })

    const onSend = async (content: string) => {
        if (sendMessage.isPending || !me) return
        sendMessage.mutate({ content })
    }

    return (
        <div
            className="pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <MessageInput
                placeholder="Type a message..."
                onChatSend={onSend}
                disabled={sendMessage.isPending}
                className="shadow-none border-t-0 p-4"
            />
        </div>
    )
}

