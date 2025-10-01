import {EditorProps} from "@tiptap/pm/view";

export const defaultEditorProps: EditorProps = {
    attributes: {
        class: `prose-sm dark:prose-invert prose-headings:font-title font-default focus:outline-hidden max-w-full`,
    },
    handleDOMEvents: {
        keydown: (_view, event) => {
            // prevent default event listeners from firing when slash command is active
            if (["ArrowUp", "ArrowDown", "Enter"].includes(event.key)) {
                const slashCommand = document.querySelector("#slash-command");
                if (slashCommand) {
                    return true;
                }
            }

            return false
        },
    },
};
