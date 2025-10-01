import {cn} from "@/lib";
import {ComponentPropsWithoutRef} from "react";

export function Gradient({
                             className,
                             ...props
                         }: ComponentPropsWithoutRef<'div'>) {
    return (
        <div
            {...props}
            className={cn(
                className,
                'bg-linear-[115deg] from-[var(--color-primary-lime)]/70 from-[28%] via-[#ee87cb] via-[70%] to-[var(--color-primary-cosmos)]/70 animate-logo-hue',
            )}
        />
    )
}

export function GradientBackground() {
    return (
        <div className="relative mx-auto max-w-7xl">
            <div
                className={cn(
                    'absolute -right-60 -top-44 h-60 w-[36rem] transform-gpu md:right-0',
                    'bg-[linear-gradient(115deg,var(--tw-gradient-stops))] from-[#fff1be] from-[28%] via-[#ee87cb] via-[70%] to-[#b060ff]',
                    'rotate-[-10deg] rounded-full blur-3xl',
                )}
            />
        </div>
    )
}
