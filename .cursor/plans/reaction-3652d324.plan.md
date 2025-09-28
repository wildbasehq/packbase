<!-- 3652d324-cca0-4ece-83ca-c8ab57be6da8 4c9fd82d-dddd-4cbd-a728-b3aa29730c4e -->
# Implement Reaction Stack with Emoji Picker

#### Overview

Build `ClientReactionStack` in `apps/web/src/components/ui/reaction-stack.tsx` that renders reaction pills with counts, supports toggling, overflow `+N`, and an optional emoji-add flow using the existing `EmojiPicker` from `@emoji-picker.tsx`. Add a `ServerReactionStack` wrapper (dummy for now) that will later hold API calls.

#### Key Details

- Use Tailwind + shadcn tokens: `bg-muted`, `bg-accent`, `text-muted-foreground`, `border`, `hover:bg-accent`, etc.
- Extensibility: render props and callbacks for `onToggle` and `onAdd`; configurable size and max visible reactions.
- Accessibility: semantic `button` for pills with `aria-pressed` for reacted state; keyboard operable.

#### Essential Interfaces (concise)

```ts
// apps/web/src/components/ui/reaction-stack.tsx
export type Reaction = {
  key: string;            // unique per emoji (e.g., ":thumbs_up:", or the emoji itself)
  emoji: string;          // actual emoji character
  count: number;          // total reactions
  reactedByMe?: boolean;  // if current user has reacted
};

export type ClientReactionStackProps = {
  reactions: Reaction[];
  onToggle?: (key: string, nextReacted: boolean) => Promise<void> | void;
  onAdd?: (emoji: { emoji: string; label?: string } | string) => Promise<void> | void;
  allowAdd?: boolean;         // show "+" button and picker, `false` if server hit max
  showPicker?: boolean;       // control picker visibility externally (optional)
  defaultShowPicker?: boolean;// uncontrolled picker visibility
  maxVisible?: number;        // collapse after N - ServerReactionStack has `max` which prevents any new reactions.
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
  renderPill?: (reaction: Reaction) => React.ReactNode; // optional custom rendering
};
```

#### UI Behavior (concise)

- Render visible reactions up to `maxVisible` as pills: `[emoji] [count]`.
- Style pills: `inline-flex items-center gap-1 rounded-md border bg-muted px-2 h-7 text-xs hover:bg-accent aria-pressed:bg-accent/70`.
- Toggling: clicking a pill calls `onToggle(key, !reactedByMe)` and optimistically toggles local state if desired (keep controlled-first; fall back to internal mirror state when callbacks are absent).
- Overflow: if `reactions.length > maxVisible` show `+N` pill to expand/collapse.
- Add new: if `allowAdd`, render a `+` button. Clicking shows the Emoji Picker.
- Emoji Picker: use components from `apps/web/src/components/ui/emoji-picker.tsx` and pass-through the picker `onEmojiSelect` to call `onAdd`.

#### Emoji Picker Integration (concise)

```ts
import { EmojiPicker, EmojiPickerSearch, EmojiPickerContent, EmojiPickerFooter } from "@/src/components/ui/emoji-picker";
// ...
<EmojiPicker onEmojiSelect={(emoji) => onAdd?.(emoji ?? "")}>
  <EmojiPickerSearch placeholder="Search emoji" />
  <EmojiPickerContent />
  <EmojiPickerFooter />
</EmojiPicker>
```

#### Server Wrapper (dummy)

- `ServerReactionStack` props: `{ entityId: string; endpoint?: string; initialReactions?: Reaction[]; ...ClientReactionStackProps overrides }`.
- For now: keep state locally, log actions with `console.info`, delegate to `ClientReactionStack`.

#### Exports

- Export `ClientReactionStack` and `ServerReactionStack` from `reaction-stack.tsx`.

#### Notes

- No external packages added. Uses existing EmojiPicker wrapper and shared `cn` utility for class composition.
- If `@/src/components/ui/popover` exists, mount EmojiPicker inside it. Otherwise, render a positioned panel relative to the `+` button using `absolute` within a `relative` wrapper.

### To-dos

- [ ] Define Reaction type and ClientReactionStack props in reaction-stack.tsx
- [ ] Implement ClientReactionStack UI with pills, toggle, disabled, size
- [ ] Add overflow handling with +N and expand/collapse
- [ ] Integrate EmojiPicker for add flow with shadcn tokens
- [ ] Create ServerReactionStack wrapper with console-based dummy handlers
- [ ] Export components and JSDoc usage inline in reaction-stack.tsx