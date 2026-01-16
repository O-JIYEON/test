import { NavLink, Outlet } from 'react-router-dom';

const menuItems = [
  { label: '대시보드', path: '/' },
  { label: '프로젝트 관리', path: '/projects' },
  { label: '영업', path: '/sales' },
  { label: '기간1', path: '/period-1' },
  { label: '기간2', path: '/period-2' },
  { label: '기간3', path: '/period-3' },
  { label: '설정', path: '/settings' }
];

function App() {
  return (
    <div className="app">
      <aside className="sidebar">
        <h1 className="sidebar__title">메뉴</h1>
        <nav className="sidebar__nav">
          <ul>
            {menuItems.map((item) => (
              <li key={item.label} className="sidebar__item">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar__link${isActive ? ' is-active' : ''}`
                  }
                  end={item.path === '/'}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

export default App;
