import { cn } from "@/lib/utils";

export default function Card({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) {
    return (
        <div className={cn(className, "flex h-fit w-full flex-col rounded border bg-card px-2 py-3 sm:max-w-md sm:px-3 sm:py-4")} {...props}>
            {children}
        </div>
    );
}
