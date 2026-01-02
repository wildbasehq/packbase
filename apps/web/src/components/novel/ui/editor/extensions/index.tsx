import {InputRule} from '@tiptap/core'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import Placeholder from '@tiptap/extension-placeholder'
import {TextStyle} from '@tiptap/extension-text-style'
import TiptapUnderline from '@tiptap/extension-underline'
import StarterKit from '@tiptap/starter-kit'
import {Markdown} from 'tiptap-markdown'
import CustomKeymap from './custom-keymap'
import SlashCommand from './slash-command'

export const defaultExtensions = [
    StarterKit.configure({
        heading: {
            levels: [1, 2, 3],
            HTMLAttributes: {
                class: 'enforce-proper-heading-size',
            },
        },
        bulletList: {
            HTMLAttributes: {
                class: 'list-disc pl-4',
            },
        },
        orderedList: {
            HTMLAttributes: {
                class: 'list-decimal pl-4',
            },
        },
        listItem: {
            HTMLAttributes: {
                class: 'leading-normal',
            },
        },
        blockquote: {
            HTMLAttributes: {
                class: 'border-l-4 border-stone-700',
            },
        },
        codeBlock: {
            HTMLAttributes: {
                class: 'rounded-md bg-stone-200 p-4 font-mono font-medium text-stone-900',
            },
        },
        code: {
            HTMLAttributes: {
                class: 'rounded-md bg-stone-200 px-1.5 py-1 font-mono font-medium text-stone-900',
                spellcheck: 'false',
            },
        },
        horizontalRule: false,
        dropcursor: {
            color: '#DBEAFE',
            width: 4,
        },
        gapcursor: false
    }),
    // patch to fix horizontal rule bug: https://github.com/ueberdosis/tiptap/pull/3859#issuecomment-1536799740
    HorizontalRule.extend({
        addInputRules() {
            return [
                new InputRule({
                    find: /^(?:---|—-|___\s|\*\*\*\s)$/,
                    handler: ({state, range}) => {
                        const attributes = {}

                        const {tr} = state
                        const start = range.from
                        let end = range.to

                        tr.insert(start - 1, this.type.create(attributes)).delete(tr.mapping.map(start), tr.mapping.map(end))
                    },
                }),
            ]
        },
    }).configure({
        HTMLAttributes: {
            class: 'mt-4 mb-6 border-t border-stone-300',
        },
    }),
    // UpdatedImage.configure({
    //     HTMLAttributes: {
    //         class: 'rounded-lg border border-stone-200',
    //     },
    // }),
    Placeholder.configure({
        placeholder: ({node}) => {
            if (node.type.name === 'heading') {
                return `Heading ${node.attrs.level}`
            }
            if (window.location.pathname.startsWith('/books/')) {
                return 'HTML Mode. Hit "/" for commands, select text for formatting...'
            }

            return 'What\'s on your mind?'
        },
        includeChildren: true,
    }),
    SlashCommand,
    TiptapUnderline,
    TextStyle,
    CustomKeymap,
    // DragAndDrop,
]

export const markdownExtensions = [
    Markdown.configure({
        html: true,
        transformCopiedText: true,
        transformPastedText: true,
    })
]