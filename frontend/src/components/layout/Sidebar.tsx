import { NavLink } from 'react-router-dom';
import dashboardIcon from '../../assets/icon/dashboard.svg';
import customersIcon from '../../assets/icon/customers.svg';
import dealIcon from '../../assets/icon/deal.svg';
import historyIcon from '../../assets/icon/history.svg';
import leadIcon from '../../assets/icon/lead.svg';
import settingIcon from '../../assets/icon/setting.svg';
import './sidebar.css';

const menuIcons = {
  대시보드: dashboardIcon,
  고객사: customersIcon,
  리드: leadIcon,
  '딜(기회)': dealIcon,
  활동기록: historyIcon,
  설정: settingIcon
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
                <span className="sidebar__icon">
                  {menuIcons[item.label] && (
                    <img src={menuIcons[item.label]} alt="" aria-hidden="true" />
                  )}
                </span>
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
