import styles from './loading-dots.module.css'
import {cn} from "@/lib";

const LoadingDots = ({ className }: { color?: string; className?: string }) => {
    return (
        <span className={cn(styles.loading, className)}>
            <span className="bg-n-7 dark:bg-white" />
            <span className="bg-n-7 dark:bg-white" />
            <span className="bg-n-7 dark:bg-white" />
        </span>
    )
}

export default LoadingDots
