import {cn} from '@/lib/utils'
import {isNodeSelection} from '@tiptap/react'
import {BubbleMenu, BubbleMenuProps} from '@tiptap/react/menus'
import {ColorSelector} from '@/components/novel/ui/editor/bubble-menu/color-selector'
import {BoldIcon, CodeIcon, ItalicIcon, StrikethroughIcon, UnderlineIcon} from 'lucide-react'
import {FC, useState} from 'react'
import {NodeSelector} from './node-selector'

export interface BubbleMenuItem {
    name: string
    isActive: () => boolean
    command: () => void
    icon: typeof BoldIcon
}

type EditorBubbleMenuProps = Omit<BubbleMenuProps, 'children'>

export const EditorBubbleMenu: FC<EditorBubbleMenuProps> = props => {
    if (!props.editor) throw new Error('EditorBubbleMenu: no editor provided')
    const items: BubbleMenuItem[] = [
        {
            name: 'bold',
            // @ts-ignore
            isActive: () => props.editor.isActive('bold'),
            // @ts-ignore
            command: () => props.editor.chain().focus().toggleBold().run(),
            icon: BoldIcon,
        },
        {
            name: 'italic',
            // @ts-ignore
            isActive: () => props.editor.isActive('italic'),
            // @ts-ignore
            command: () => props.editor.chain().focus().toggleItalic().run(),
            icon: ItalicIcon,
        },
        {
            name: 'underline',
            // @ts-ignore
            isActive: () => props.editor.isActive('underline'),
            // @ts-ignore
            command: () => props.editor.chain().focus().toggleUnderline().run(),
            icon: UnderlineIcon,
        },
        {
            name: 'strike',
            // @ts-ignore
            isActive: () => props.editor.isActive('strike'),
            // @ts-ignore
            command: () => props.editor.chain().focus().toggleStrike().run(),
            icon: StrikethroughIcon,
        },
        {
            name: 'code',
            // @ts-ignore
            isActive: () => props.editor.isActive('code'),
            // @ts-ignore
            command: () => props.editor.chain().focus().toggleCode().run(),
            icon: CodeIcon,
        },
    ]

    const bubbleMenuProps: EditorBubbleMenuProps = {
        ...props,
        shouldShow: ({state, editor}) => {
            const {selection} = state
            const {empty} = selection

            // don't show bubble menu if:
            // - the selected node is an image
            // - the selection is empty
            // - the selection is a node selection (for drag handles)
            return !(editor.isActive('image') || empty || isNodeSelection(selection))
        }
    }

    const [isNodeSelectorOpen, setIsNodeSelectorOpen] = useState(false)
    const [isColorSelectorOpen, setIsColorSelectorOpen] = useState(false)
    const [isLinkSelectorOpen, setIsLinkSelectorOpen] = useState(false)

    return (
        <BubbleMenu
            {...bubbleMenuProps}
            className="flex w-fit overflow-hidden divide-x bg-card rounded border shadow-xl"
        >
            <NodeSelector
                editor={props.editor}
                isOpen={isNodeSelectorOpen}
                setIsOpen={() => {
                    setIsNodeSelectorOpen(!isNodeSelectorOpen)
                    setIsColorSelectorOpen(false)
                    setIsLinkSelectorOpen(false)
                }}
            />
            {/*<LinkSelector*/}
            {/*    editor={props.editor}*/}
            {/*    isOpen={isLinkSelectorOpen}*/}
            {/*    setIsOpen={() => {*/}
            {/*        setIsLinkSelectorOpen(!isLinkSelectorOpen)*/}
            {/*        setIsColorSelectorOpen(false)*/}
            {/*        setIsNodeSelectorOpen(false)*/}
            {/*    }}*/}
            {/*/>*/}
            <div className="flex">
                {items.map((item, index) => (
                    <button
                        key={index}
                        onClick={item.command}
                        className="p-2 text-foreground hover:bg-accent/50 data-active:bg-accent/70 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        type="button"
                    >
                        <item.icon
                            className={cn('h-4 w-4', {
                                'text-blue-500': item.isActive(),
                            })}
                        />
                    </button>
                ))}
            </div>
            <ColorSelector
                editor={props.editor}
                open={isColorSelectorOpen}
                onOpenChange={() => {
                    setIsColorSelectorOpen(!isColorSelectorOpen)
                    setIsNodeSelectorOpen(false)
                    setIsLinkSelectorOpen(false)
                }}
            />
        </BubbleMenu>
    )
}
