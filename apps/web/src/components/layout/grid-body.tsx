import {ReactNode} from "react";

export default function GridBody({children, className}: {
    children: ReactNode
    className?: string
}) {
    return (
        <div className={`${className} grid justify-center items-center px-12 py-lg mx-auto`}>
            {children}
        </div>
    )
}