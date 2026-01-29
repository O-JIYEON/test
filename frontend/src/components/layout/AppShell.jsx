import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

import menuItems from '../../constants/menuItems';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';

function AppShell() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="app">
      <TopHeader theme={theme} onToggleTheme={toggleTheme} />
      <div className="app__body">
        <Sidebar menuItems={menuItems} />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppShell;
