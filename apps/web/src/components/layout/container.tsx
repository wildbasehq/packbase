import {cn} from "@/lib";
import {ReactNode} from "react";

export function Container({
                              className,
                              children,
                          }: {
    className?: string
    children: ReactNode
}) {
    return (
        <div className={cn(className, 'px-6 lg:px-8')}>
            <div className="mx-auto max-w-2xl lg:max-w-7xl">{children}</div>
        </div>
    )
}
