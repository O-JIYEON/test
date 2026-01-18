import { Navigate, Route, Routes } from 'react-router-dom';

import menuItems from './data/menuItems';
import MenuPage from './pages/menu/MenuPage';
import ProjectsPage from './pages/projects/ProjectsPage';
import UsersPage from './pages/users/UsersPage';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';

function App() {
  return (
    <div className="app">
      <TopHeader />
      <div className="app__body">
        <Sidebar menuItems={menuItems} />
        <main className="content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            {menuItems.map((item) => {
              if (item.path === '/projects') {
                return <Route key={item.path} path={item.path} element={<ProjectsPage />} />;
              }
              if (item.path === '/period-1') {
                return <Route key={item.path} path={item.path} element={<UsersPage />} />;
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
