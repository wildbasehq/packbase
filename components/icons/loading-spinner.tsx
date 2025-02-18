import styles from "./loading-spinner.module.css";
import cx from "classnames";

export default function LoadingSpinner() {
  return (
    <div className={cx('dark:invert', styles.spinner)}>
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
  );
}
