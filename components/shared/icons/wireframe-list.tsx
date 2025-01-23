export default function WireframeList({...props}: {
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
                                <pattern id="c" width="34" height="24" x="15" y="172" data-loading="false" patternUnits="userSpaceOnUse">
                                    <path fill="url(#b)" d="M0 0h34v24H0z"/>
                                </pattern>
                            </defs>
                            <path fill="url(#c)" d="m40 174-5 1h-1l-4 4 6 1h1l3-6Zm9 11v1l-1 2-2 1-1 1H35l-1 1-5 5h-1l-2-5-9 1v-1l2-5v-1l-4-1 5-3 1-1 3-5h1l5-3s1 0 0 0l-1 8 9 1 1 1 2 2v1h8Z"/>
                            <g>
                                <path fill="#fff" d="M33 183h5v1l-1 1h-2l-2-2Z" className="fill-white"/>
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
                            <rect width="240" height="80" x="168" y="464" rx="12" ry="12"/>
                            <rect width="240" height="80" x="168" y="360" rx="12" ry="12"/>
                            <rect width="240" height="80" x="168" y="256" rx="12" ry="12"/>
                            <rect width="240" height="80" x="168" y="152" rx="12" ry="12"/>
                            <rect width="240" height="80" x="168" y="48" rx="12" ry="12"/>
                        </g>
                    </g>
                </g>
            </g>
        </svg>
    )
}