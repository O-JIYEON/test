import { NavLink } from 'react-router-dom';

const menuIcons = {
  대시보드: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
      <rect x="13" y="13" width="8" height="8" rx="2" />
    </svg>
  ),
  고객사: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 20V6a2 2 0 0 1 2-2h6v16H4z" />
      <path d="M12 20V4h6a2 2 0 0 1 2 2v14h-8z" />
      <path d="M7 8h2M7 12h2M7 16h2M15 8h2M15 12h2M15 16h2" />
    </svg>
  ),
  리드: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  '딜(기회)': (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6v12" />
      <path d="M15 9.5c0-1.4-1.3-2.5-3-2.5s-3 1-3 2.5c0 3.5 6 1.5 6 5 0 1.5-1.3 2.5-3 2.5s-3-1-3-2.5" />
    </svg>
  ),
  활동기록: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 6v6l4 2" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  설정: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2.5v2.5M12 19v2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2.5 12h2.5M19 12h2.5M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
      <path d="M6.2 9.2a6 6 0 1 1 11.6 5.6a6 6 0 0 1-11.6-5.6z" />
    </svg>
  )
};

function Sidebar({ menuItems }) {
  return (
    <aside className="sidebar">
      <nav className="sidebar__nav">
        <ul>
          {menuItems
            .filter((item) => !item.hidden)
            .map((item) => (
            <li key={item.path} className="sidebar__item">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
                }
              >
                <span className="sidebar__icon">{menuIcons[item.label]}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
