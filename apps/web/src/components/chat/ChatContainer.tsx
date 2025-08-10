import React from 'react'
import { cn } from '@/lib/utils/cn'

export interface ChatContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode
  footer?: React.ReactNode
}

export function ChatContainer({ header, footer, className, children, ...props }: ChatContainerProps) {
  return (
    <div
      className={cn(
        'flex h-full w-full flex-col rounded shadow-sm border bg-card',
        className,
      )}
      {...props}
    >
      {header && (
        <div className={cn('flex items-center justify-between border-b px-4 py-3')}>
          {header}
        </div>
      )}
      <div className={cn('flex-1 overflow-y-auto')}>{children}</div>
      {footer && <div className={cn('border-t px-4 py-3')}>{footer}</div>}
    </div>
  )
}
