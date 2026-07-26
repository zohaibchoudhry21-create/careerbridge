import React, { useId } from 'react';
import { ReactComponent as Sun } from './Sun.svg';
import { ReactComponent as Moon } from './Moon.svg';
import { useDarkMode } from '../../useDarkMode';
import './DarkMode.css';

const DarkMode = () => {
  const toggleId = useId();
  const { isDark, setDark } = useDarkMode();

  return (
    <div className="dark_mode">
      <input
        className="dark_mode_input"
        type="checkbox"
        id={toggleId}
        checked={isDark}
        onChange={(event) => setDark(event.target.checked)}
      />
      <label className="dark_mode_label" htmlFor={toggleId}>
        <Sun />
        <Moon />
      </label>
    </div>
  );
};

export default DarkMode;
