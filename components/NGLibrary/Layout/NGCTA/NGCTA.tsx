import React from 'react';

export function NGCTA({...props}: {
    children: React.ReactNode;
}) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto justify-center items-center">
            {props.children}
        </div>
    )
}

export function NGCTABody({...props}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col space-y-4">
            {props.children}
        </div>
    )
}

export function NGCTASideImage({...props}: {
    src: string;
    alt: string;
    className?: string;
}) {
    return (
        <div className="flex items-center justify-end">
            <img
                src={props.src}
                alt={props.alt} className={props.className || 'h-48'}/>
        </div>
    )
}