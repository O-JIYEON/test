import express from 'express';

const app = express();
const PORT = process.env.PORT || 3001;

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/overview', (req, res) => {
  res.json({
    message: '영업 관리 백엔드가 실행 중입니다.',
    summary: {
      newLeads: 12,
      activeDeals: 5,
      upcomingMeetings: 3
    }
  });
});

app.listen(PORT, () => {
  console.log(`Sales management backend listening on port ${PORT}`);
});
