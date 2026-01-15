import {SVGProps} from 'react'

// Need professional remake :(
export function RehowlIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <polyline
                points="22 16 18.5 16 18.5 19.5"
                id="polyline3"
                transform="matrix(0,1.2034039,-1.2439627,0,42.676119,-4.9258735)"/>
            <ellipse
                cx="11.88588"
                cy="9.8582993"
                fill="currentColor"
                id="circle4"
                rx="0.84589463"
                ry="0.81831467"
                strokeWidth="2"
            />
            <path
                d="M 18.621117,1.2033471 A 12.480175,11.60267 0 0 0 6.2033424,11.529723"
                strokeWidth="2"/>
            <path
                d="m 1.2272837,11.968348 c 0,5.981595 5.0124697,10.808135 11.1956643,10.808135 3.12987,-0.01139 6.134018,-1.192842 8.384308,-3.297326"
                strokeWidth="2"/>
            <path
                d="M 1.5,11.742262 H 6"
                strokeWidth="2"
            />
        </svg>
    )
}