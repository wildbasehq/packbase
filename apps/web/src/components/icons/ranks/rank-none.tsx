import React, {SVGProps} from 'react'

const UnrankedIcon = (props: SVGProps<SVGSVGElement>) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 128 128"
            width="1em"
            height="1em"
            {...props}
        >
            <title>diamond-unranked</title>
            <g id="Layer_2" data-name="Layer 2">
                <g id="Display">
                    {/* Background rect (originally hidden) */}
                    <rect width="128" height="128" fill="#1a1a1a" opacity="0"/>

                    {/* The Diamond Shape */}
                    <rect
                        fill="currentColor"
                        className="text-[#324652]"
                        x="45.81"
                        y="45.52"
                        width="36.45"
                        height="36.45"
                        rx="3.68"
                        transform="translate(-26.32 63.95) rotate(-45)"
                    />
                </g>
            </g>
        </svg>
    )
}

export default UnrankedIcon