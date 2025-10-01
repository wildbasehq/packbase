import {ReactNode} from "react";

export function CTA({...props}: { children: ReactNode }) {
    return <div
        className="mx-auto grid max-w-6xl grid-cols-1 items-center justify-center gap-8 lg:grid-cols-2">{props.children}</div>
}

export function CTABody({...props}: { children: ReactNode }) {
    return <div className="flex flex-col space-y-4">{props.children}</div>
}

export function CTASideImage({...props}: { src: string; alt: string; className?: string }) {
    return (
        <div className="flex items-center justify-end">
            <img src={props.src} alt={props.alt} className={props.className || 'h-48'}/>
        </div>
    )
}
