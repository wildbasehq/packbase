# Chat Performance Optimization Plan

## Phase 1: Core Memoization

### 1.1 Component Memoization

**MessageItem.tsx - Add React.memo with custom comparison**

```tsx
export const MessageItem = React.memo<MessageItemProps>(({ 
  message, 
  isOwn, 
  onClick, 
  showAvatar 
}) => {
  // existing implementation
}, (prevProps, nextProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.edited_at === nextProps.message.edited_at &&
    prevProps.isOwn === nextProps.isOwn &&
    prevProps.showAvatar === nextProps.showAvatar
  );
});
```

**MessageGroup.tsx - Memoize with complex comparison**

```tsx
export const MessageGroup = React.memo<MessageGroupProps>(({ 
  group, 
  author, 
  ...props 
}) => {
  // existing implementation
}, (prevProps, nextProps) => {
  return (
    prevProps.group.items.length === nextProps.group.items.length &&
    prevProps.group.items.every((item, i) =>
      item.id === nextProps.group.items[i].id &&
      item.content === nextProps.group.items[i].content
    ) &&
    prevProps.editingMessageId === nextProps.editingMessageId
  );
});
```

### 1.2 Callback Optimization in MessagesList

```tsx
// In MessagesList component
const startEdit = useCallback((messageId: string, currentContent: string) => {
  setEditingMessageId(messageId);
  setEditContent(currentContent || '');
}, []);

const deleteMessage = useCallback(async (messageId: string) => {
  // existing implementation
}, [messagesFrame, session]);

const getAuthorInfo = useCallback((authorId: string) => {
  // existing implementation - memoize this expensive operation
}, [me, recipient]);
```

## Phase 2: Smart Context Usage
*Medium Impact, Medium Risk*

### 2.1 Context Optimization

```tsx
// Create specialized hooks to avoid unnecessary re-renders
export const useContentFrameData = (targetSignature?: string) => {
  const context = useContentFrame(targetSignature);
  return useMemo(() => ({
    data: context.data,
    loading: context.loading,
    error: context.error
  }), [context.data, context.loading, context.error]);
};

// Separate contexts for different data types
export const useContentFrameActions = (targetSignature?: string) => {
  const context = useContentFrame(targetSignature);
  return useMemo(() => ({
    refresh: context.refresh,
    mutate: context.mutate
  }), [context.refresh, context.mutate]);
};
```

### 2.2 Data Normalization

```tsx
// Create normalized message store to reduce deep equality checks
interface NormalizedMessages {
  byId: Record<string, Message>;
  allIds: string[];
  groups: MessageGroup[];
}

const useNormalizedMessages = (rawMessages: any[]) => {
  return useMemo(() => {
    const byId: Record<string, Message> = {};
    const allIds: string[] = [];

    rawMessages.forEach(msg => {
      byId[msg.id] = msg;
      allIds.push(msg.id);
    });

    return { 
      byId, 
      allIds, 
      groups: createGroups(rawMessages) 
    };
  }, [rawMessages]);
};
```

## Phase 3: Virtual Scrolling
*High Impact, High Risk*

### 3.1 Implement React-Window

**VirtualMessageList.tsx - New component**

```tsx
import { FixedSizeList as List } from 'react-window';

const VirtualMessageList = ({ groups, ...props }) => {
  const Row = useCallback(({ index, style }) => {
    const group = groups[index];
    return (
      <div style={style}>
        <MessageGroup key={group.id} {...group} {...props} />
      </div>
    );
  }, [groups, props]);

  return (
    <List
      height={600}
      itemCount={groups.length}
      itemSize={80} // Estimate, could be dynamic
    >
      {Row}
    </List>
  );
};
```

## Phase 4: State Management Optimization

### 4.1 Message State Isolation

```tsx
// Create dedicated message store
const useMessageStore = create((set, get) => ({
  messages: [],
  editingMessageId: null,
  editContent: '',

  // Actions that don't trigger re-renders in other components
  setEditingMessage: (id: string, content: string) =>
    set({ editingMessageId: id, editContent: content }),

  updateMessage: (id: string, updates: Partial<Message>) =>
    set(state => ({
      messages: state.messages.map(msg =>
        msg.id === id ? { ...msg, ...updates } : msg
      )
    })),
}));
```

### 4.2 ContentFrame Refresh Debouncing

```tsx
// Debounced refresh to reduce API calls
const useDebouncedContentFrame = (
  signature: string, 
  refreshInterval?: number
) => {
  const context = useContentFrame(signature);
  const debouncedRefresh = useDebouncedCallback(context.refresh, 1000);

  return {
    ...context,
    refresh: debouncedRefresh
  };
};
```

## Phase 5: Advanced Optimizations
*Low Impact, Medium Risk*

### 5.1 Message Intersection Observer

```tsx
// Only render messages that are visible
const useVisibleMessages = (messages: Message[]) => {
  const [visibleRange, setVisibleRange] = useState({
    start: 0, 
    end: 50 
  });

  // Implement intersection observer logic
  return messages.slice(visibleRange.start, visibleRange.end);
};
```

### 5.2 Optimistic Updates with Rollback

```tsx
// Improve perceived performance with optimistic updates
const useOptimisticMessage = () => {
  const [optimisticMessages, setOptimisticMessages] = useState([]);

  const addOptimisticMessage = (message: Message) => {
    setOptimisticMessages(prev => [
      ...prev, 
      { ...message, _optimistic: true }
    ]);
  };

  const commitMessage = (tempId: string, realMessage: Message) => {
    setOptimisticMessages(prev =>
      prev.filter(msg => msg.id !== tempId)
    );
  };

  return { 
    optimisticMessages, 
    addOptimisticMessage, 
    commitMessage 
  };
};
```

## Implementation Roadmap

### Week 1: Foundation
1. Add React.memo to all chat components with proper comparison functions
2. Optimize callbacks in MessagesList with useCallback
3. Memoize expensive computations (date formatting, author info)
4. Create specialized ContentFrame hooks

### Week 2: Context & Data Flow
1. Implement normalized message store
2. Add debounced refresh for ContentFrame
3. Optimize prop drilling with context selectors
4. Add performance monitoring/profiling

### Week 3: Virtual Scrolling
1. Install and configure react-window
2. Implement VirtualMessageList component
3. Add dynamic row height calculation
4. Test with large message datasets

### Week 4: Advanced Features
1. Implement optimistic updates
2. Add message intersection observer
3. Fine-tune virtual scrolling performance
4. Add error boundaries and fallbacks

## Expected Performance Improvements

- **Reduce re-renders by 70-80%** with proper memoization
- **Handle 10,000+ messages smoothly** with virtual scrolling
- **Improve scroll performance by 60%** with intersection observer
- **Reduce API calls by 50%** with debounced refresh
- **Better perceived performance** with optimistic updates

This plan prioritizes quick wins (memoization) first, then tackles more complex optimizations progressively while maintaining code quality and user experience.