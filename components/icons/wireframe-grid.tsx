export default function WireframeGrid({ ...props }: {
    [key: string]: any;
}): JSX.Element {
    return (
        <svg viewBox="0 0 512 512" fill="none" {...props}>
            <defs>
                <clipPath id="a">
                    <rect width="512" height="512" fill="#e8e9ea" rx="0" ry="0"/>
                </clipPath>
            </defs>
            <g clipPath="url(#a)">
                <g>
                    <rect width="512" height="512" fill="#e8e9ea" rx="0" ry="0"/>
                </g>
                <g>
                    <g>
                        <rect width="64" height="512" fill="#fff" rx="0" ry="0"/>
                    </g>
                    <g>
                        <circle cx="32" cy="328" r="12" fill="#b1b2b5"/>
                        <circle cx="32" cy="292" r="12" fill="#b1b2b5"/>
                        <circle cx="32" cy="256" r="12" fill="#b1b2b5"/>
                        <circle cx="32" cy="220" r="12" fill="#b1b2b5"/>
                        <g fill="#000" className="w-8">
                            <defs>
                                <linearGradient id="b" x1="0" x2="1" y1="0" y2="1">
                                    <stop offset="0" stopColor="#60a5fa"/>
                                    <stop offset="1" stopColor="#34d399"/>
                                </linearGradient>
                                <pattern id="c" width="34" height="24" x="15" y="172" patternUnits="userSpaceOnUse">
                                    <path fill="url(#b)" d="M0 0h34v24H0z"/>
                                </pattern>
                            </defs>
                            <path fill="url(#c)" d="m39.8 174.2-.1-.2-5 1.1-.6.3-3.8 3.7.1.3 6 .8c.2 0 .4 0 .5-.2l3-5.8Zm9 11.3.2.3-.6 1.7c0 .2-.2.4-.4.5l-2.4 1.4-.6.1-10.2.8a1 1 0 0 0-.5.2l-5.8 5.4h-.3l-2.2-4.7-.4-.2-8.4.6c-.2 0-.3-.1-.2-.2l1.8-5.6c0-.2 0-.3-.2-.4l-3.5-1.4c-.1 0-.1-.1 0-.2l5.3-3.2.2-.2.2-.2 3.4-5.3c0-.2.2-.3.4-.4l5.7-2.5c.1 0 .2 0 .2.2l-1.8 7.6c0 .1 0 .3.3.3l9.3 1.3c.2 0 .4.1.5.3l1.9 2.6.4.3 7.7.9Z"/>
                            <g>
                                <path fill="#fff" d="M33.2 182.8c-.1-.1 0-.2 0-.2l4 .5c.2 0 .5.2.5.3l.4.4-.1.4-.8.5-.6.2h-1c-.1 0-.4 0-.5-.2l-2-1.9Z" className="fill-white"/>
                            </g>
                        </g>
                    </g>
                    <defs>
                        <clipPath id="d">
                            <rect width="448" height="512" x="64" fill="#e8e9ea" rx="0" ry="0"/>
                        </clipPath>
                    </defs>
                    <g clipPath="url(#d)">
                        <g>
                            <rect width="448" height="512" x="64" fill="#e8e9ea" rx="0" ry="0"/>
                        </g>
                        <g fill="#b1b2b5">
                            <rect width="101.3" height="102" x="362.7" y="378" rx="12" ry="12"/>
                            <rect width="101.3" height="74" x="362.7" y="280" rx="12" ry="12"/>
                            <rect width="101.3" height="74" x="362.7" y="182" rx="12" ry="12"/>
                            <rect width="101.3" height="110" x="362.7" y="48" rx="12" ry="12"/>
                            <rect width="101.3" height="106" x="237.3" y="308" rx="12" ry="12"/>
                            <rect width="101.3" height="106" x="237.3" y="178" rx="12" ry="12"/>
                            <rect width="101.3" height="106" x="237.3" y="48" rx="12" ry="12"/>
                            <rect width="101.3" height="136" x="112" y="317" rx="12" ry="12"/>
                            <rect width="101.3" height="136" x="112" y="157" rx="12" ry="12"/>
                            <rect width="101.3" height="85" x="112" y="48" rx="12" ry="12"/>
                        </g>
                    </g>
                </g>
            </g>
        </svg>
    )
}