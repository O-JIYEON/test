import ROUTES from './routes';

const menuItems = [
  { label: '대시보드', path: ROUTES.dashboard },
  { label: '고객사', path: ROUTES.customers, hidden: false },
  { label: '리드', path: ROUTES.leads },
  { label: '딜(기회)', path: ROUTES.deals },
  { label: '활동기록', path: ROUTES.activities },
  { label: '설정', path: ROUTES.settings, hidden: false }
];

export default menuItems;
