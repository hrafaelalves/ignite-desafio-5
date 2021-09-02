import commonStyles from '../../styles/common.module.scss';
import styles from './header.module.scss';

export default function Header(): JSX.Element {
  return (
    <header>
      <div className={`${commonStyles.wrapper} ${styles.headerContent}`}>
        <img src="/logo.svg" alt="logo" />
      </div>
    </header>
  );
}
