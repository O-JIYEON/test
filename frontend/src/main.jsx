import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import App from './App.jsx';
import MenuPage from './MenuPage.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<MenuPage title="대시보드" />} />
          <Route path="projects" element={<MenuPage title="프로젝트 관리" />} />
          <Route path="sales" element={<MenuPage title="영업" />} />
          <Route path="period-1" element={<MenuPage title="기간1" />} />
          <Route path="period-2" element={<MenuPage title="기간2" />} />
          <Route path="period-3" element={<MenuPage title="기간3" />} />
          <Route path="settings" element={<MenuPage title="설정" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
