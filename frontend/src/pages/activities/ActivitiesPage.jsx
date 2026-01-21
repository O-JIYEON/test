import { useEffect, useState } from 'react';

const API_BASE = `http://${window.location.hostname}:5001`;

const columns = [
  { key: 'lead_code', label: 'Lead Id' },
  { key: 'deal_code', label: 'Deal Id' },
  { key: 'activity_date', label: '활동일' },
  { key: 'manager', label: '담당자' },
  { key: 'next_action_date', label: '다음액션일' },
  { key: 'next_action_content', label: '다음액션내용' },
  { key: 'sales_owner', label: '담당자(영업)' }
];

const formatDate = (value) => {
  if (!value) {
    return '';
  }
  const text = String(value).replace('T', ' ');
  return text.length >= 16 ? text.slice(0, 16) : text.slice(0, 10);
};

function ActivitiesPage() {
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('loading');
  const [toastMessage, setToastMessage] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const showToast = (message) => {
    setToastMessage(message);
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      setToastMessage('');
    }, 1500);
  };

  const loadLogs = async () => {
    try {
      setStatus('loading');
      const response = await fetch(`${API_BASE}/api/activity-logs`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch activity logs');
      }
      setLogs(data.logs || []);
      setStatus('ready');
      setPage(1);
    } catch (error) {
      console.error(error);
      setStatus('error');
      showToast('데이터를 불러오지 못했습니다.');
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const totalPages = Math.max(1, Math.ceil(logs.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const pageStart = (clampedPage - 1) * pageSize;
  const visibleLogs = logs.slice(pageStart, pageStart + pageSize);
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <>
      <header className="content__header">
        <div className="content__header-row">
          <h2>활동기록</h2>
        </div>
      </header>
      <section className="content__section content__section--single">
        <div className="content__card content__card--wide">
          {status === 'loading' && <p className="table__status">불러오는 중...</p>}
          {status === 'error' && null}
          {status === 'ready' && logs.length === 0 && <p className="table__status">데이터가 없습니다.</p>}
          {status === 'ready' && logs.length > 0 && (
            <div className="table__wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    {columns.map((column) => (
                      <th key={column.key}>{column.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleLogs.map((log) => (
                    <tr key={log.id} className="data-table__row">
                      {columns.map((column) => {
                        if (column.key === 'activity_date' || column.key === 'next_action_date') {
                          return <td key={column.key}>{formatDate(log[column.key])}</td>;
                        }
                        return <td key={column.key}>{log[column.key] ?? ''}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {status === 'ready' && logs.length > 0 && (
            <div className="pagination">
              <button
                className="icon-button"
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={clampedPage === 1}
                aria-label="이전 페이지"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15.5 19l-7-7 7-7" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
              <div className="pagination__pages">
                {pages.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    className={`pagination__page${pageNumber === clampedPage ? ' pagination__page--active' : ''}`}
                    type="button"
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={clampedPage === totalPages}
                aria-label="다음 페이지"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.5 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </section>
      {toastMessage && <div className="toast">{toastMessage}</div>}
    </>
  );
}

export default ActivitiesPage;
