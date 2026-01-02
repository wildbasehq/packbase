import styles from './loading-dots.module.css'
import cx from 'classnames'

const LoadingDots = ({ className }: { color?: string; className?: string }) => {
    return (
        <span className={cx(styles.loading, className)}>
            <span className="bg-n-7 dark:bg-white" />
            <span className="bg-n-7 dark:bg-white" />
            <span className="bg-n-7 dark:bg-white" />
        </span>
    )
}

export default LoadingDots
