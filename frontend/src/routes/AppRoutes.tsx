import { Navigate, Route, Routes } from 'react-router-dom';

import AppShell from '../components/layout/AppShell';
import ROUTES from '../constants/routes';
import DashboardPage from '../pages/dashboard/DashboardPage';
import DealsPage from '../pages/deals/DealsPage';
import ActivitiesPage from '../pages/activities/ActivitiesPage';
import LeadsPage from '../pages/leads/LeadsPage';
import NotFoundPage from '../pages/notFound/NotFoundPage';
import CustomersPage from '../pages/customers/CustomersPage';
import SettingsPage from '../pages/settings/SettingsPage';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<Navigate to={ROUTES.dashboard} replace />} />
        <Route path={ROUTES.dashboard} element={<DashboardPage />} />
        <Route path={ROUTES.customers} element={<CustomersPage />} />
        <Route path={ROUTES.deals} element={<DealsPage />} />
        <Route path={ROUTES.activities} element={<ActivitiesPage />} />
        <Route path={ROUTES.leads} element={<LeadsPage />} />
        <Route path={ROUTES.settings} element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
