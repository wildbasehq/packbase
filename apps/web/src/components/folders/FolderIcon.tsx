import {motion} from 'motion/react'
import {useMemo} from 'react'
import {Link} from 'wouter'

interface FolderProps {
    name: string;
    fileCount: number;
    /**
     * List of visible files in the folder, URLs to use as icons.
     */
    visibleFiles: string[];
    color?: string;
    darkColor?: string;
    href?: string;
    onClick?: () => void;
    className?: string;
    size?: number;
}

export function generateFolderColors(name: string) {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }

    const h = Math.abs(hash % 360)
    const s = 70 // 70% saturation for vibrant colors
    const l = 67 // 67% lightness for the main color (close to #FD577B which is HSL 347, 97%, 67%)

    // We want to avoid too light or too dark colors, and maybe keep it in a certain range if we want to match the brand
    // But the requirement says "generate based on the name", so full spectrum is probably fine.

    return {
        color: `hsl(${h}, ${s}%, ${l}%)`,
        darkColor: `hsl(${h}, ${s}%, ${l - 12}%)` // 12% darker for darkColor
    }
}

export default function Folder({
                                   name,
                                   fileCount,
                                   color: propColor,
                                   darkColor: propDarkColor,
                                   size = 32,
                                   visibleFiles = [],
                                   href,
                                   onClick,
                                   className = '',
                               }: FolderProps) {
    const generatedColors = useMemo(() => generateFolderColors(name), [name])

    const color = propColor || generatedColors.color
    // Use generated darkColor if no propDarkColor is provided.
    // This darkColor is derived from the same hash as the color.
    const darkColor = propDarkColor || generatedColors.darkColor

    const folderContent = (
        <motion.div
            className={`relative rounded-2xl overflow-hidden cursor-pointer will-change-transform transition-transform active:scale-[1.02] md:active:scale-[0.98] ${className}`}
            tabIndex={0}
            onClick={onClick}
            initial="rest"
            whileHover="hover"
            animate="rest"
            style={{width: `${size}rem`, height: `${size / 1.3}rem`}}
        >
            {/* Background */}
            <svg
                viewBox="0 0 90 56"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
            >
                <path
                    d="M12 0 H32.5471 C35.1211 0 37.6338 0.784908 39.75 2.25 C41.8662 3.71509 44.3789 4.5 46.9529 4.5 H78.5 C85.1274 4.5 90.5 9.87258 90.5 16.5 V44 C90.5 50.63 85.1274 56 78.5 56 H12 C5.37258 56 0 50.63 0 44 V12 C0 5.37258 5.37258 0 12 0 Z"
                    fill={color}
                />
            </svg>

            {/* Cards */}
            <div className="absolute -left-[0.1rem] mx-4 w-full h-full"
                 style={{
                     top: `${size / 6}rem`,
                 }}
            >
                {visibleFiles.map((file, idx) => (
                    <FolderCard key={idx}
                                idx={idx}
                                offset={idx * (size / 5)}
                                size={size}
                                image={file}/>
                ))}
            </div>

            {/* Footer Info */}
            <div
                className="inline-flex flex-col items-start justify-center gap-0 shadow-[0px_-10px_10px_-3px_rgba(0,0,0,0.1)] h-1/2 absolute bottom-0 px-3 left-0 z-10 pointer-events-none w-full select-none"
                style={{
                    backgroundColor: darkColor,
                }}
            >
                <div
                    className="relative flex items-center justify-start w-full font-medium text-white tracking-tight leading-none truncate"
                    style={{fontSize: `${size / 14}rem`}}
                >
                    {name}
                </div>
                <div
                    className="relative flex items-center justify-start w-full font-normal text-white/90 tracking-tight leading-none whitespace-nowrap mt-0.5"
                    style={{fontSize: `${size / 18}rem`}}
                >
                    {fileCount} {fileCount === 1 ? 'howl' : 'howls'}
                </div>


            </div>
        </motion.div>
    )

    if (href) {
        return (
            <Link href={href} className="inline-block">
                {folderContent}
            </Link>
        )
    }

    return folderContent
}

function FolderCard({idx, offset, size, image}: {
    idx: number;
    offset: number;
    size: number;
    image: string;
}) {
    const rotationToIDX = [
        -2.84,
        3,
        2.84,
    ]
    const hoverRotationToIDX = [
        -8.84,
        2,
        4.84,
    ]
    const rotation = rotationToIDX[idx % rotationToIDX.length]
    const hoverRotation = hoverRotationToIDX[idx % hoverRotationToIDX.length]

    const variants = {
        rest: {
            y: 0,
            rotate: rotation,
        },
        hover: {
            y: -size / 12 + 'rem',
            rotate: hoverRotation,
            transition: {
                type: 'spring',
                duration: 0.5,
                bounce: 0.2,
            }
        }
    }

    return (
        <motion.div
            // @ts-ignore
            variants={variants}
            className="absolute top-px left-px w-1/3 h-full bg-white rounded-[5px] border border-solid border-[#ededed] shadow-[0_1px_2px_rgba(0,0,0,0.05)] origin-bottom-lef"
            style={{
                left: `${offset}rem`,
                backgroundImage: `url(${image})`,
                backgroundSize: 'cover',
            }}
        />
    )
}