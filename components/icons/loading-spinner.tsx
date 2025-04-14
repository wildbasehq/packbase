import styles from './loading-spinner.module.css'
import cx from 'classnames'

export default function LoadingSpinner({className}: {
    className?: string;
}) {
    return (
        <div className={cx('dark:invert', styles.spinner, className)}>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div>
    )
}
