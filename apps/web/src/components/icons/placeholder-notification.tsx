export default function PlaceholderNotification({ rounded = 24, ...props }) {
    const frameRadius = Math.max(0, rounded)
    const frameStrokeRadius = Math.max(0, rounded - 0.5)
    const barRadius = Math.max(0, Math.round((rounded / 8) * 2))

    return (
        <svg width="336" height="115" viewBox="0 0 336 115" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <rect
                x="0.464363"
                y="19.6227"
                width="300"
                height="64"
                rx={frameRadius}
                transform="rotate(-1 0.464363 19.6227)"
                fill="currentColor"
            />
            <rect
                x="0.973013"
                y="20.1139"
                width="299"
                height="63"
                rx={frameStrokeRadius}
                transform="rotate(-1 0.973013 20.1139)"
                stroke="black"
                strokeOpacity="0.2"
            />
            <g clipPath="url(#clip0_1_73)">
                <rect x="7.97875" y="30.0639" width="42" height="42" rx="21" transform="rotate(-1 7.97875 30.0639)" fill="#EFEFF0" />
                <rect x="7.84206" y="30.6942" width="43" height="40" fill="url(#pattern0_1_73)" />
            </g>
            <rect x="8.4874" y="30.5551" width="41" height="41" rx="20.5" transform="rotate(-1 8.4874 30.5551)" stroke="#D6D8DB" />
            <rect x="60.093" y="36.1553" width="154" height="12" rx={barRadius} transform="rotate(-1 60.093 36.1553)" fill="#D9D9D9" />
            <rect
                x="60.3722"
                y="52.1528"
                width="84"
                height="12"
                rx={barRadius}
                transform="rotate(-1 60.3722 52.1528)"
                fill="#D9D9D9"
                fillOpacity="0.65"
            />

            <rect
                x="31.5441"
                y="34.3111"
                width="300"
                height="64"
                rx={frameRadius}
                transform="rotate(1.5 31.5441 34.3111)"
                fill="currentColor"
            />
            <rect
                x="32.0309"
                y="34.824"
                width="299"
                height="63"
                rx={frameStrokeRadius}
                transform="rotate(1.5 32.0309 34.824)"
                stroke="black"
                strokeOpacity="0.2"
            />
            <g clipPath="url(#clip1_1_73)">
                <rect x="38.5959" y="45.0701" width="42" height="42" rx="21" transform="rotate(1.5 38.5959 45.0701)" fill="#EFEFF0" />
                <rect x="38.4319" y="45.6938" width="43" height="40" transform="rotate(2.5 38.4319 45.6938)" fill="url(#pattern1_1_73)" />
            </g>
            <rect x="39.0827" y="45.583" width="41" height="41" rx="20.5" transform="rotate(1.5 39.0827 45.583)" stroke="#D6D8DB" />
            <rect x="90.3949" y="53.4288" width="154" height="12" rx={barRadius} transform="rotate(1.5 90.3949 53.4288)" fill="#D9D9D9" />
            <rect
                x="89.976"
                y="69.4234"
                width="84"
                height="12"
                rx={barRadius}
                transform="rotate(1.5 89.976 69.4234)"
                fill="#D9D9D9"
                fillOpacity="0.65"
            />
            <g opacity="0.75" clipPath="url(#clip2_1_73)">
                <path
                    d="M317.838 17.9404C318.119 18.554 318.714 18.9721 319.386 19.0295C321.135 19.1784 322.372 19.7432 322.522 20.6048C322.671 21.4664 321.698 22.4156 320.103 23.1466C319.489 23.4278 319.071 24.0221 319.014 24.6947C318.864 26.4421 318.3 27.6801 317.438 27.83C316.577 27.98 315.627 27.007 314.896 25.4112C314.758 25.1092 314.542 24.8494 314.27 24.658C313.998 24.4667 313.681 24.3507 313.35 24.3218C311.599 24.1731 310.363 23.6084 310.213 22.7468C310.063 21.8852 311.036 20.936 312.633 20.2046C313.246 19.9237 313.664 19.3294 313.721 18.6569C313.87 16.9079 314.436 15.6712 315.296 15.5215C316.158 15.3716 317.107 16.3445 317.838 17.9404Z"
                    fill="#38BDF8"
                />
            </g>
            <path
                d="M12.5807 101.792C12.6729 102.46 13.1362 103.022 13.7737 103.244C15.989 104.007 17.407 105.143 17.2971 106.278C17.1872 107.413 15.5757 108.256 13.2583 108.579C12.5903 108.673 12.0275 109.138 11.8072 109.775C11.0438 111.987 9.9052 113.407 8.77204 113.297C7.63888 113.187 6.794 111.576 6.47094 109.258C6.3772 108.59 5.91394 108.028 5.27645 107.806C3.06269 107.044 1.64308 105.907 1.75302 104.772C1.86296 103.637 3.47444 102.794 5.79348 102.47C6.46139 102.377 7.02404 101.914 7.24274 101.276C8.00807 99.0613 9.14647 97.6434 10.2781 97.753C11.4128 97.863 12.2561 99.4744 12.5807 101.792Z"
                fill="#7DD3FC"
            />
            <defs>
                <pattern id="pattern0_1_73" patternContentUnits="objectBoundingBox" width="1" height="1">
                    <use xlinkHref="#image0_1_73" transform="scale(0.00173611 0.00186632)" />
                </pattern>
                <pattern id="pattern1_1_73" patternContentUnits="objectBoundingBox" width="1" height="1">
                    <use xlinkHref="#image0_1_73" transform="scale(0.00173611 0.00186632)" />
                </pattern>
                <clipPath id="clip0_1_73">
                    <rect x="7.97875" y="30.0639" width="42" height="42" rx="21" transform="rotate(-1 7.97875 30.0639)" fill="white" />
                </clipPath>
                <clipPath id="clip1_1_73">
                    <rect x="38.5959" y="45.0701" width="42" height="42" rx="21" transform="rotate(1.5 38.5959 45.0701)" fill="white" />
                </clipPath>
                <clipPath id="clip2_1_73">
                    <rect width="24.987" height="24.987" fill="white" transform="translate(307 4.28401) rotate(-9.8721)" />
                </clipPath>
            </defs>
        </svg>
    )
}
