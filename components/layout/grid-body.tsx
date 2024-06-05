export default function GridBody({ children, className }: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <div className={`${className} grid justify-center items-center px-12 py-lg`}>
            {children}
        </div>
    )
}