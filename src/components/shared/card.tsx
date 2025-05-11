import { cn } from "@/lib/utils";

export default function Card({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) {
    return (
        <div className={cn(className, "flex h-fit max-w-md flex-col rounded border bg-card px-3 py-4")} {...props}>
            {children}
        </div>
    );
}
