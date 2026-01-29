import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    message: '딜(기회) 백엔드가 실행 중입니다.',
    summary: {
      newLeads: 12,
      activeDeals: 5,
      upcomingMeetings: 3
    }
  });
});

export default router;
