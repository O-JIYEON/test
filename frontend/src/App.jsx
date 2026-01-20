import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import menuItems from './data/menuItems';
import DashboardPage from './pages/dashboard/DashboardPage';
import MenuPage from './pages/menu/MenuPage';
import ProjectsPage from './pages/projects/ProjectsPage';
import SalesPage from './pages/sales/SalesPage';
import SalesProjectPage from './pages/sales-project/SalesProjectPage';
import UsersPage from './pages/users/UsersPage';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';

function App() {
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
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            {menuItems.map((item) => {
            if (item.path === '/projects') {
              return <Route key={item.path} path={item.path} element={<ProjectsPage />} />;
            }
            if (item.path === '/deals') {
              return <Route key={item.path} path={item.path} element={<SalesPage />} />;
            }
            if (item.path === '/dashboard') {
              return <Route key={item.path} path={item.path} element={<DashboardPage />} />;
            }
            if (item.path === '/period-1') {
              return <Route key={item.path} path={item.path} element={<UsersPage />} />;
            }
            if (item.path === '/period-2') {
              return <Route key={item.path} path={item.path} element={<SalesProjectPage />} />;
            }
              return (
                <Route key={item.path} path={item.path} element={<MenuPage title={item.label} />} />
              );
            })}
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
