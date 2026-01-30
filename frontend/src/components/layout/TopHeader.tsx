import sunIcon from '../../assets/icon/sun.svg';
import moonIcon from '../../assets/icon/moon.svg';
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
        <button
          type="button"
          className="theme-toggle-icons"
          onClick={onToggleTheme}
          aria-label="테마 변경"
        >
          <span className="theme-toggle-icon theme-toggle-icon--sun" aria-hidden="true">
            <img src={sunIcon} alt="" aria-hidden="true" />
          </span>
          <span className="theme-toggle-icon theme-toggle-icon--moon" aria-hidden="true">
            <img src={moonIcon} alt="" aria-hidden="true" />
          </span>
        </button>
      </div>
    </header>
  );
}

export default TopHeader;
