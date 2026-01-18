import { NavLink } from 'react-router-dom';

function Sidebar({ menuItems }) {
  return (
    <aside className="sidebar">
      <nav className="sidebar__nav">
        <ul>
          {menuItems.map((item) => (
            <li key={item.path} className="sidebar__item">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
                }
              >
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
