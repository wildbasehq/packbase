import {Button} from '@/components/shared'
import {cn} from '@/lib/utils/cn'
import {Paperclip, Send, Smile} from 'lucide-react'
import {motion} from 'motion/react'
import {forwardRef, KeyboardEventHandler, useImperativeHandle, useRef, useState} from 'react'
import {ChatEvents} from './types'

interface MessageInputProps extends ChatEvents {
    placeholder?: string
    disabled?: boolean
    className?: string
}

export const MessageInput = forwardRef<HTMLTextAreaElement, MessageInputProps>(
    ({onChatSend, placeholder = 'Type a message...', disabled, className}, ref) => {
        const [value, setValue] = useState('')
        const [isFocused, setIsFocused] = useState(false)
        const inputRef = useRef<HTMLTextAreaElement>(null)

        // Forward the ref to the input element
        useImperativeHandle(ref, () => inputRef.current!, [])

        const send = () => {
            if (!value.trim() || disabled) return
            onChatSend?.(value)
            setValue('')
            // Auto-focus after sending
            setTimeout(() => {
                inputRef.current?.focus()
                // Reset height
                if (inputRef.current) inputRef.current.style.height = 'auto'
            }, 0)
        }

        const onKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
            }
        }

        return (
            <motion.div
                layout
                className={cn('p-4', className)}
            >
                <div
                    className={cn(
                        'flex items-center gap-2 rounded-2xl border bg-muted px-2 py-2 shadow-sm transition-all duration-200',
                        isFocused ? 'ring-1 ring-ring' : 'border-border/60 hover:border-border',
                        disabled && 'opacity-50 pointer-events-none'
                    )}
                >
                    <button
                        type="button"
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
                    >
                        <Paperclip size={18}/>
                    </button>

                    <textarea
                        ref={r => {
                            // @ts-ignore
                            inputRef.current = r
                        }}
                        value={value}
                        onChange={e => {
                            setValue(e.target.value)
                            e.target.style.height = 'auto'
                            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
                        }}
                        onKeyDown={onKeyDown}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder={placeholder}
                        disabled={disabled}
                        rows={1}
                        className="flex-1 bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground/70 min-w-0 resize-none max-h-[120px]"
                    />

                    <button
                        type="button"
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
                    >
                        <Smile size={18}/>
                    </button>

                    <Button
                        type="button"
                        onClick={send}
                        disabled={disabled || !value.trim()}
                        className={cn(
                            'rounded-xl h-9 w-9 shrink-0 p-0 flex items-center justify-center transition-all duration-200',
                            value.trim() ? 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90' : 'bg-muted text-muted-foreground hover:bg-muted/80 shadow-none'
                        )}
                    >
                        <Send size={16} className={value.trim() ? 'ml-0.5' : ''}/>
                    </Button>
                </div>
            </motion.div>
        )
    }
)

MessageInput.displayName = 'MessageInput'
