import { cn } from '@/lib/utils'
import React from 'react'

export interface IconProps extends React.SVGAttributes<SVGElement> {
    className?: string
    size?: number | string
    dark?: boolean
}

export default function FolderCollectionIcon({ className, size = 113, dark = false, ...props }: IconProps) {
    dark = dark || document.documentElement.classList.contains('dark')
    const fillColour = dark ? '#FFF' : 'rgb(30 30 32)'
    const fillBackgroundColour = dark ? '#000' : '#FFFFFF'

    return (
        <svg
            width={size}
            height={size !== 113 ? size : 90}
            viewBox="0 0 113 90"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn('', className)}
            {...props}
        >
            <path
                d="M14.375 33.5093C14.9537 33.4215 15.5478 33.375 16.1523 33.375M14.375 33.5093C11.3513 33.9776 8.63409 35.6191 6.81281 38.0778C4.99153 40.5365 4.21303 43.614 4.64616 46.643L9.074 77.643C9.46946 80.413 10.8508 82.9475 12.9644 84.7811C15.078 86.6147 17.782 87.6245 20.5802 87.625H93.425C96.2231 87.6245 98.9272 86.6147 101.041 84.7811C103.154 82.9475 104.536 80.413 104.931 77.643L109.359 46.643C109.792 43.614 109.014 40.5365 107.192 38.0778C105.371 35.6191 102.649 33.9776 99.625 33.5093M14.375 33.5093L14.3802 14C14.3802 10.9178 15.6042 7.96167 17.7832 5.78171C19.9622 3.60175 22.9178 2.37637 26 2.375H46.0415C48.0962 2.37681 50.0661 3.19451 51.5182 4.64833L62.4818 15.6017C63.9338 17.0555 65.9038 17.8732 67.9585 17.875H88C91.0831 17.875 94.04 19.0998 96.2201 21.2799C98.4002 23.46 99.625 26.4169 99.625 29.5V33.5093M16.1523 33.375C48.0563 33.375 65.9436 33.375 97.8477 33.375M16.1523 33.375H97.8477M97.8477 33.375C98.4522 33.375 99.0463 33.4215 99.625 33.5093"
                stroke={fillColour}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M30.282 22.0645L37.1157 46.1205C37.9935 49.2109 36.1982 52.4256 33.1105 53.3028L18.0755 57.5738C14.9851 58.4515 11.7707 56.6571 10.8935 53.5696L4.05978 29.5135C3.63834 28.03 3.82333 26.4394 4.57435 25.0924C5.32532 23.7455 6.58044 22.7521 8.0638 22.3306L23.0988 18.0595C26.1893 17.1816 29.4049 18.9767 30.282 22.0645Z"
                fill={fillColour}
                stroke={fillColour}
                strokeWidth="4"
            />
            <path
                d="M108.758 29.1222L102.286 53.2779C101.454 56.3811 98.264 58.2199 95.1635 57.3891L80.0662 53.3438C76.9631 52.5121 75.1241 49.323 75.9547 46.2225L82.4272 22.0668C82.8264 20.5772 83.801 19.3066 85.1367 18.5355C86.4722 17.7645 88.0592 17.5554 89.5487 17.9545L104.646 21.9998C107.749 22.8313 109.589 26.0216 108.758 29.1222Z"
                fill={fillColour}
                stroke={fillColour}
                strokeWidth="4"
            />
            <g filter="url(#filter0_d_10_32)">
                <path
                    d="M82.9745 17.2989C82.8855 12.986 79.3171 9.55768 75 9.6467L35.8134 9.96892C33.7411 10.0116 31.7707 10.8758 30.3357 12.3713C28.9006 13.8668 28.1184 15.8711 28.1611 17.9434L28.6767 42.9461C28.7656 47.259 32.334 50.6873 36.6511 50.5983L75.8378 50.2761C80.1507 50.1871 83.579 46.6188 83.49 42.3016L82.9745 17.2989Z"
                    fill={fillColour}
                />
                <path
                    d="M80.9749 17.3402L81.4904 42.3427C81.5546 45.4544 79.1629 48.0438 76.0957 48.2628L75.7961 48.2768L36.6343 48.5979L36.6099 48.5984C33.3978 48.6646 30.7421 46.1143 30.6758 42.9051L30.1603 17.9026C30.1285 16.3607 30.7114 14.8688 31.7792 13.756C32.7803 12.7129 34.1312 12.0821 35.5667 11.9813L35.8546 11.9685L75.0164 11.6464L75.0408 11.6459C78.1527 11.5818 80.7421 13.9742 80.9609 17.0416L80.9749 17.3402Z"
                    stroke={fillColour}
                    strokeWidth="4"
                />
            </g>
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M16.5184 34C15.9193 34 15.3305 34.0454 14.7571 34.1312C11.7607 34.5887 9.06799 36.1924 7.26315 38.5944C5.45831 40.9964 4.68683 44.0031 5.11605 46.9623L9.50393 77.248C9.89583 79.9542 11.2647 82.4303 13.3592 84.2216C15.4537 86.013 18.1334 86.9995 20.9063 87H93.0937C95.8666 86.9995 98.5463 86.013 100.641 84.2216C102.735 82.4303 104.104 79.9542 104.496 77.248L108.884 46.9623C109.313 44.0031 108.542 40.9964 106.737 38.5944C104.932 36.1924 102.234 34.5887 99.2378 34.1312C98.6644 34.0454 98.0755 34 97.4765 34H16.5184Z"
                fill={fillBackgroundColour}
                stroke={fillColour}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <defs>
                <filter
                    id="filter0_d_10_32"
                    x="27.1595"
                    y="9.64502"
                    width="57.3322"
                    height="45.955"
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                >
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                    <feOffset dy="4" />
                    <feGaussianBlur stdDeviation="0.5" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0" />
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_10_32" />
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_10_32" result="shape" />
                </filter>
            </defs>
        </svg>
    )
}
