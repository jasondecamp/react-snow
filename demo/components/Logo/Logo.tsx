import classNames from 'classnames';
import styles from './Logo.module.scss';

type LogoProps = {
  isDay: boolean;
};

// The favicon's snowflake, drawn as a CSS mask so its color can follow the
// playground's sky rather than the system color scheme.
export const Logo = ({ isDay }: LogoProps) => (
  <div className={classNames(styles.logo, isDay && styles.day)} role='img' aria-label='react-snow' />
);
