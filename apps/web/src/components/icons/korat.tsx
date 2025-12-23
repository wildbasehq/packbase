export default function KoratIcon({...props}: any) {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...props}>
            <defs>
                <style>
                    {`
                    .cls-1 {
                    fill: none;
                    stroke: currentColor;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                    stroke-width: 2px;
                    transition: all;
                }
                    `}
                </style>
            </defs>
            <g>
                <line className="cls-1" x1="5" y1="5" x2="5" y2="9"/>
                <line className="cls-1" x1="9" y1="5" x2="9" y2="9"/>
                <path
                    className="cls-1"
                    d="m4.2,17h9.6c1.12,0,1.68,0,2.11-.22.38-.19.68-.5.87-.87.22-.43.22-.99.22-2.11V4.2c0-1.12,0-1.68-.22-2.11-.19-.38-.5-.68-.87-.87-.43-.22-.99-.22-2.11-.22H4.2c-1.12,0-1.68,0-2.11.22-.38.19-.68.5-.87.87-.22.43-.22.99-.22,2.11v9.6c0,1.12,0,1.68.22,2.11.19.38.5.68.87.87.43.22.99.22,2.11.22Z"
                />
            </g>
        </svg>
    )
}
