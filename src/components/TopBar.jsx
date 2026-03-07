/** components/TopBar.jsx */
import React from 'react';
import { useApp } from '../context/AppContext.jsx';

export default function TopBar({ title, onBack, rightContent }) {
  const { goBack } = useApp();

  return (
    <header className="top-bar">
      <button
        className="icon-btn"
        aria-label="뒤로"
        onClick={onBack ?? goBack}
      >
        {onBack !== false && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        )}
      </button>

      <h1 className="app-title">{title}</h1>

      <div className="icon-btn">{rightContent}</div>
    </header>
  );
}
