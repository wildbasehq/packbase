export default function Flex({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: any }): JSX.Element {
    return (
        <div className={`flex ${className}`} {...props}>
            {children}
        </div>
    )
}
