import {ReactNode} from 'react'

export declare interface BodyType {
    noPadding?: boolean;

    theme?: any;
    children?: ReactNode;
    className?: string;
}

export default function Body({...props}: BodyType) {
    return (
        <div
            id="NGBody"
            className={`relative justify-center m-auto overflow-hidden`}>
            <div
                className={`flex flex-col py-10 px-4 sm:px-6 lg:py-12 lg:px-8 mx-auto ${props.className}`}>
                {props.children}
            </div>
        </div>
    )
}