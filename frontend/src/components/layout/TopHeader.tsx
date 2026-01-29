import './topHeader.css';

function TopHeader({ theme, onToggleTheme }) {
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <div className="app-header__logo">CRM</div>
        <div className="app-header__text">
          <h1>SI CRM MVP</h1>
          <p>Leads. Deals. Activities. Dashboards</p>
        </div>
      </div>
      <div className="app-header__actions">
        <label className="toggle-check">
          <span className="theme-toggle-icons" aria-hidden="true">
            <span className="theme-toggle-icon theme-toggle-icon--sun">
              <svg viewBox="0 0 24 24">
                <path
                  d="M12 4.5V2m0 20v-2.5m7.5-7.5H22M2 12h2.5M17.7 6.3l1.8-1.8M4.5 19.5l1.8-1.8m11.4 1.8-1.8-1.8M6.3 6.3 4.5 4.5M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="theme-toggle-icon theme-toggle-icon--moon">
              <svg viewBox="0 0 24 24">
                <path
                  d="M15.5 4.1a8 8 0 1 0 4.4 13.8A7 7 0 0 1 15.5 4.1z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </span>
          <input
            type="checkbox"
            checked={theme === 'dark'}
            onChange={onToggleTheme}
            aria-label="다크 테마 토글"
          />
        </label>
      </div>
    </header>
  );
}

export default TopHeader;
