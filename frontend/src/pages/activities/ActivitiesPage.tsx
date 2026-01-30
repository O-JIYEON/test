import { useEffect, useState } from 'react';
import { fetchActivityLogs } from '../../api/activities.api';
import Pagination from '../../components/common/pagination';
import Toast from '../../components/feedback/Toast';
import Loading from '../../components/feedback/Loading';
import { formatKstDateTime } from '../../utils/date';
import dayjs from '../../utils/date';
import './activities.css';

const columns = [
  { key: 'lead_code', label: 'Lead Id' },
  { key: 'deal_code', label: 'Deal Id' },
  { key: 'activity_date', label: '활동일' },
  { key: 'company', label: '회사명' },
  { key: 'project_name', label: '프로젝트/건명' },
  { key: 'expected_amount', label: '예상금액(원)' },
  { key: 'manager', label: '담당자' },
  { key: 'next_action_date', label: '다음액션일' },
  { key: 'next_action_content', label: '다음액션내용' },
  { key: 'deal_stage', label: '딜 단계' },
  { key: 'sales_owner', label: '담당자(영업)' }
];

const formatDate = (value) => formatKstDateTime(value);
const formatAmount = (value) => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return '-';
  }
  return `${numeric.toLocaleString('ko-KR')}원`;
};

function ActivitiesPage() {
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('loading');
  const [toastMessage, setToastMessage] = useState('');
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayCount, setDisplayCount] = useState(0);
  const pageSize = 10;

  const showToast = (message) => {
    setToastMessage(message);
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      setToastMessage('');
    }, 1500);
  };

  const copyToClipboard = async (value) => {
    if (!value) {
      return;
    }
    const text = String(value);
    const tryLegacyCopy = () => {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', 'true');
        textarea.style.position = 'fixed';
        textarea.style.top = '-9999px';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success;
      } catch (error) {
        return false;
      }
    };
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        showToast('복사되었습니다.');
        return;
      }
      if (tryLegacyCopy()) {
        showToast('복사되었습니다.');
      } else {
        showToast('복사에 실패했습니다.');
      }
    } catch (error) {
      if (tryLegacyCopy()) {
        showToast('복사되었습니다.');
      } else {
        console.error(error);
        showToast('복사에 실패했습니다.');
      }
    }
  };

  const loadLogs = async () => {
    try {
      setStatus('loading');
      const data = await fetchActivityLogs();
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

  useEffect(() => {
    const target = logs.length;
    const startValue = displayCount;
    const duration = 300;
    let startTime = null;
    let rafId;

    const step = (timestamp) => {
      if (!startTime) {
        startTime = timestamp;
      }
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const nextValue = Math.round(startValue + (target - startValue) * progress);
      setDisplayCount(nextValue);
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [logs.length]);

  const filteredLogs = logs.filter((log) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return true;
    }
    const company = String(log.company ?? '').toLowerCase();
    const dealCode = String(log.deal_code ?? '').toLowerCase();
    const leadCode = String(log.lead_code ?? '').toLowerCase();
    const projectName = String(log.project_name ?? '').toLowerCase();
    return (
      company.includes(query) ||
      dealCode.includes(query) ||
      leadCode.includes(query) ||
      projectName.includes(query)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const pageStart = (clampedPage - 1) * pageSize;
  const visibleLogs = filteredLogs.slice(pageStart, pageStart + pageSize);
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <>
      <header className="content__header">
        <div className="content__header-row">
          <div className="content__header-group">
            <h2>활동기록</h2>
            <span className="content__section-meta">{displayCount}건</span>
          </div>
        </div>
      </header>
      <section className="content__section content__section--single">
        <div className="filter-row">
          <form className="project-form filter-form" onSubmit={(event) => event.preventDefault()}>
            <div className="filter-form__fields">
              <label className="project-form__field filter-form__field--wide filter-form__field--compact" htmlFor="activity-search">
                <input
                  id="activity-search"
                  name="activity-search"
                  type="text"
                  placeholder=" "
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setPage(1);
                  }}
                />
                <span>검색 (회사, Lead Id, Deal Id)</span>
              </label>
            </div>
          </form>
        </div>
        <div className="content__card content__card--wide">
          {status === 'loading' && <Loading />}
          {status === 'error' && null}
          {status === 'ready' && (
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
                  {filteredLogs.length === 0 && (
                    <tr className="data-table__row data-table__row--empty">
                      <td colSpan={columns.length} className="data-table__empty">
                        데이터가 없습니다.
                      </td>
                    </tr>
                  )}
                  {filteredLogs.length > 0 && visibleLogs.map((log) => (
                    <tr key={log.id} className="data-table__row">
                      {columns.map((column) => {
                        if (column.key === 'activity_date') {
                          return <td key={column.key}>{formatDate(log[column.key])}</td>;
                        }
                        if (column.key === 'next_action_date') {
                          const raw = log[column.key];
                          const formatted = raw ? dayjs.utc(raw).tz('Asia/Seoul').format('YYYY-MM-DD') : '';
                          return <td key={column.key}>{formatted || '-'}</td>;
                        }
                        if (column.key === 'lead_code' || column.key === 'deal_code') {
                          const value = log[column.key];
                          return (
                            <td key={column.key}>
                              <button
                                className="table-copy"
                                type="button"
                                onClick={() => copyToClipboard(value)}
                              >
                                {value || '-'}
                              </button>
                            </td>
                          );
                        }
                        if (column.key === 'next_action_content') {
                          const value = log[column.key] || '';
                          const cleaned = value.split(' / 딜단계 변경:')[0].trim();
                          return <td key={column.key}>{cleaned || '-'}</td>;
                        }
                        if (column.key === 'expected_amount') {
                          return <td key={column.key}>{formatAmount(log.expected_amount)}</td>;
                        }
                        if (column.key === 'deal_stage') {
                          return <td key={column.key}>{log.deal_stage || '-'}</td>;
                        }
                        return <td key={column.key}>{log[column.key] ?? ''}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {status === 'ready' && filteredLogs.length > 0 && (
            <Pagination page={clampedPage} totalPages={totalPages} onChange={setPage} variant="icon" />
          )}
        </div>
      </section>
      <Toast message={toastMessage} />
    </>
  );
}

export default ActivitiesPage;
