import { useEffect, useState } from 'react';
import ConfirmDialog from '../../components/ConfirmDialog';

const salesProjectFields = [
  { name: 'company', label: '회사', type: 'text' },
  { name: 'project', label: '프로젝트', type: 'text' },
  { name: 'owner', label: '담당자', type: 'text' },
  {
    name: 'source',
    label: '유입경로',
    type: 'select',
    options: ['전체', '문의(웹/매일)', '소개', '전시/세미나', '재접촉', '콜드', '파트너']
  }
];

const salesProjectColumns = [
  { key: 'id', label: 'id' },
  { key: 'company', label: '회사' },
  { key: 'project', label: '프로젝트' },
  { key: 'owner', label: '담당자' },
  { key: 'source', label: '유입경로' }
];

const salesLogFields = [
  {
    name: 'stage',
    label: '진행단계',
    type: 'select',
    options: ['리드발굴', '미팅완료', '제안/견적', '협상', '계약 대기', '수주 완료', '실주']
  },
  { name: 'expected_amount', label: '예상금액', type: 'number' },
  { name: 'probability', label: '확률', type: 'number' },
  { name: 'weighted_amount', label: '가중금액', type: 'number' },
  { name: 'expected_close_date', label: '예상수주일', type: 'date' },
  { name: 'actual_close_date', label: '실제종료일', type: 'date' },
  {
    name: 'action_status',
    label: '액션상태',
    type: 'select',
    options: ['정상', '지연', '보류', '완료', '중단']
  },
  { name: 'next_action_date', label: '다음액션일', type: 'date' },
  { name: 'next_action_content', label: '다음액션내용', type: 'textarea' },
  { name: 'risk', label: '리스크', type: 'text' },
  {
    name: 'priority',
    label: '중요도',
    type: 'select',
    options: ['높음', '중간', '낮음', '긴급']
  },
  {
    name: 'forecast',
    label: '매출예측',
    type: 'select',
    options: ['Commit', 'Best Case', 'Pipeline/Upside', 'Omit']
  }
];

const salesLogColumns = [
  { key: 'id', label: 'id' },
  { key: 'stage', label: '진행단계' },
  { key: 'expected_amount', label: '예상금액' },
  { key: 'probability', label: '확률' },
  { key: 'weighted_amount', label: '가중금액' },
  { key: 'expected_close_date', label: '예상수주일' },
  { key: 'actual_close_date', label: '실제종료일' },
  { key: 'action_status', label: '액션상태' },
  { key: 'next_action_date', label: '다음액션일' },
  { key: 'next_action_content', label: '다음액션내용' },
  { key: 'risk', label: '리스크' },
  { key: 'priority', label: '중요도' },
  { key: 'forecast', label: '매출예측' },
  { key: 'created_at', label: '작성일' }
];

const formatDate = (value) => {
  if (!value) {
    return '';
  }
  const text = String(value);
  return text.length >= 10 ? text.slice(0, 10) : text;
};

const normalizeDateInput = (value) => formatDate(value);

const sourceInitialMap = {
  전체: 'A',
  '문의(웹/매일)': 'W',
  소개: 'I',
  '전시/세미나': 'S',
  재접촉: 'R',
  콜드: 'C',
  파트너: 'P'
};

const sourceClassMap = {
  전체: 'all',
  '문의(웹/매일)': 'inquiry',
  소개: 'referral',
  '전시/세미나': 'seminar',
  재접촉: 'recontact',
  콜드: 'cold',
  파트너: 'partner'
};

const priorityClassMap = {
  높음: 'priority-high',
  중간: 'priority-medium',
  낮음: 'priority-low',
  긴급: 'priority-urgent'
};

const riskClassMap = {
  높음: 'risk-high',
  중간: 'risk-medium',
  낮음: 'risk-low',
  긴급: 'risk-urgent'
};

const formatAmount = (value) => {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  const numeric = Number(String(value).replace(/,/g, ''));
  if (Number.isNaN(numeric)) {
    return String(value);
  }
  return numeric.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

function SalesPage() {
  const [sales, setSales] = useState([]);
  const [salesStatus, setSalesStatus] = useState('loading');
  const [logs, setLogs] = useState([]);
  const [logsStatus, setLogsStatus] = useState('idle');
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  const [projectPage, setProjectPage] = useState(1);
  const [logPage, setLogPage] = useState(1);
  const [projectFormData, setProjectFormData] = useState({});
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [projectFormStatus, setProjectFormStatus] = useState('');
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [logFormData, setLogFormData] = useState({});
  const [editingLogId, setEditingLogId] = useState(null);
  const [logFormStatus, setLogFormStatus] = useState('');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [confirmState, setConfirmState] = useState({
    open: false,
    message: '',
    onConfirm: null
  });
  const pageSize = 10;

  const loadSales = async () => {
    try {
      setSalesStatus('loading');
      const response = await fetch('http://localhost:3001/api/deals');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch deals');
      }
      const nextSales = data.deals || [];
      setSales(nextSales);
      setSalesStatus('ready');
      setProjectPage(1);
      if (nextSales.length > 0) {
        setSelectedSaleId((prev) => {
          if (prev && nextSales.some((item) => item.id === prev)) {
            return prev;
          }
          return nextSales[0].id;
        });
      } else {
        setSelectedSaleId(null);
      }
    } catch (error) {
      console.error(error);
      setSalesStatus('error');
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  useEffect(() => {
    const loadLogs = async () => {
      if (!selectedSaleId) {
        setLogs([]);
        setLogsStatus('idle');
        setLogPage(1);
        return;
      }
      try {
        setLogsStatus('loading');
        const response = await fetch(`http://localhost:3001/api/deals/${selectedSaleId}/logs`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch deal logs');
        }
        setLogs(data.logs || []);
        setLogsStatus('ready');
        setLogPage(1);
      } catch (error) {
        console.error(error);
        setLogsStatus('error');
      }
    };
    loadLogs();
  }, [selectedSaleId]);

  const openCreateProjectModal = () => {
    setEditingProjectId(null);
    const initialData = salesProjectFields.reduce((acc, field) => {
      if (field.type === 'select' && field.options?.length) {
        acc[field.name] = field.options[0];
      }
      return acc;
    }, {});
    setProjectFormData(initialData);
    setProjectFormStatus('');
    setIsProjectModalOpen(true);
  };

  const openEditProjectModal = (item) => {
    setEditingProjectId(item.id);
    const nextData = salesProjectFields.reduce((acc, field) => {
      const rawValue = item[field.name] ?? '';
      if (field.type === 'select') {
        if (rawValue) {
          acc[field.name] = rawValue;
        } else if (field.options?.length) {
          acc[field.name] = field.options[0];
        } else {
          acc[field.name] = '';
        }
        return acc;
      }
      acc[field.name] = field.type === 'date' ? normalizeDateInput(rawValue) : rawValue;
      return acc;
    }, {});
    setProjectFormData(nextData);
    setProjectFormStatus('');
    setIsProjectModalOpen(true);
  };

  const closeProjectModal = () => {
    setIsProjectModalOpen(false);
  };

  const handleProjectChange = (field, value) => {
    setProjectFormData((prev) => ({ ...prev, [field]: value }));
  };

  const submitProject = async () => {
    setProjectFormStatus('saving');
    try {
      const payload = { ...projectFormData };
      salesProjectFields.forEach((field) => {
        if (field.type === 'date' && payload[field.name]) {
          payload[field.name] = normalizeDateInput(payload[field.name]);
        }
        if (field.type === 'number' && payload[field.name] !== undefined) {
          payload[field.name] = String(payload[field.name]).replace(/,/g, '');
        }
      });
      const response = await fetch(
        editingProjectId
          ? `http://localhost:3001/api/deals/${editingProjectId}`
          : 'http://localhost:3001/api/deals',
        {
          method: editingProjectId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save deal');
      }
      await loadSales();
      setIsProjectModalOpen(false);
      setEditingProjectId(null);
      setProjectFormData({});
      setProjectFormStatus('');
    } catch (error) {
      console.error(error);
      setProjectFormStatus('error');
    }
  };

  const handleProjectSubmit = (event) => {
    event.preventDefault();
    setConfirmState({
      open: true,
      message: editingProjectId ? '딜(기회) 프로젝트를 수정하시겠습니까?' : '딜(기회) 프로젝트를 등록하시겠습니까?',
      onConfirm: () => {
        submitProject();
        setConfirmState({ open: false, message: '', onConfirm: null });
      }
    });
  };

  const deleteProject = async (item) => {
    try {
      const response = await fetch(`http://localhost:3001/api/deals/${item.id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete deal');
      }
      await loadSales();
    } catch (error) {
      console.error(error);
    }
  };

  const handleProjectDelete = (item) => {
    setConfirmState({
      open: true,
      message: '딜(기회) 프로젝트를 삭제하시겠습니까?',
      onConfirm: () => {
        deleteProject(item);
        setConfirmState({ open: false, message: '', onConfirm: null });
      }
    });
  };

  const openCreateLogModal = () => {
    if (!selectedSaleId) {
      return;
    }
    setEditingLogId(null);
    const initialData = salesLogFields.reduce((acc, field) => {
      if (field.type === 'select' && field.options?.length) {
        acc[field.name] = field.options[0];
      }
      return acc;
    }, {});
    setLogFormData(initialData);
    setLogFormStatus('');
    setIsLogModalOpen(true);
  };

  const openEditLogModal = (item) => {
    setEditingLogId(item.id);
    const nextData = salesLogFields.reduce((acc, field) => {
      const rawValue = item[field.name] ?? '';
      if (field.type === 'select') {
        if (rawValue) {
          acc[field.name] = rawValue;
        } else if (field.options?.length) {
          acc[field.name] = field.options[0];
        } else {
          acc[field.name] = '';
        }
        return acc;
      }
      acc[field.name] = field.type === 'date' ? normalizeDateInput(rawValue) : rawValue;
      return acc;
    }, {});
    setLogFormData(nextData);
    setLogFormStatus('');
    setIsLogModalOpen(true);
  };

  const closeLogModal = () => {
    setIsLogModalOpen(false);
  };

  const handleLogChange = (field, value) => {
    setLogFormData((prev) => ({ ...prev, [field]: value }));
  };

  const submitLog = async () => {
    if (!selectedSaleId) {
      return;
    }
    setLogFormStatus('saving');
    try {
      const payload = { ...logFormData };
      salesLogFields.forEach((field) => {
        if (field.type === 'date' && payload[field.name]) {
          payload[field.name] = normalizeDateInput(payload[field.name]);
        }
        if (field.type === 'number' && payload[field.name] !== undefined) {
          payload[field.name] = String(payload[field.name]).replace(/,/g, '');
        }
      });
      const response = await fetch(
        editingLogId
          ? `http://localhost:3001/api/deal-logs/${editingLogId}`
          : `http://localhost:3001/api/deals/${selectedSaleId}/logs`,
        {
          method: editingLogId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save deal log');
      }
      if (selectedSaleId) {
        const logResponse = await fetch(`http://localhost:3001/api/deals/${selectedSaleId}/logs`);
        const logData = await logResponse.json();
        if (!logResponse.ok) {
          throw new Error(logData.error || 'Failed to fetch deal logs');
        }
        setLogs(logData.logs || []);
        setLogsStatus('ready');
      }
      setIsLogModalOpen(false);
      setEditingLogId(null);
      setLogFormData({});
      setLogFormStatus('');
    } catch (error) {
      console.error(error);
      setLogFormStatus('error');
    }
  };

  const handleLogSubmit = (event) => {
    event.preventDefault();
    setConfirmState({
      open: true,
      message: editingLogId ? '딜 로그를 수정하시겠습니까?' : '딜 로그를 등록하시겠습니까?',
      onConfirm: () => {
        submitLog();
        setConfirmState({ open: false, message: '', onConfirm: null });
      }
    });
  };

  const deleteLog = async (item) => {
    try {
      const response = await fetch(`http://localhost:3001/api/deal-logs/${item.id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete deal log');
      }
      if (selectedSaleId) {
        const logResponse = await fetch(`http://localhost:3001/api/deals/${selectedSaleId}/logs`);
        const logData = await logResponse.json();
        if (!logResponse.ok) {
          throw new Error(logData.error || 'Failed to fetch deal logs');
        }
        setLogs(logData.logs || []);
        setLogsStatus('ready');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogDelete = (item) => {
    setConfirmState({
      open: true,
      message: '딜 로그를 삭제하시겠습니까?',
      onConfirm: () => {
        deleteLog(item);
        setConfirmState({ open: false, message: '', onConfirm: null });
      }
    });
  };

  const handleConfirmCancel = () => {
    setConfirmState({ open: false, message: '', onConfirm: null });
  };

  const selectedSale = sales.find((item) => item.id === selectedSaleId) || null;
  const totalProjectPages = Math.max(1, Math.ceil(sales.length / pageSize));
  const clampedProjectPage = Math.min(projectPage, totalProjectPages);
  const projectPageStart = (clampedProjectPage - 1) * pageSize;
  const visibleSales = sales.slice(projectPageStart, projectPageStart + pageSize);
  const projectPages = Array.from({ length: totalProjectPages }, (_, index) => index + 1);
  const totalLogPages = Math.max(1, Math.ceil(logs.length / pageSize));
  const clampedLogPage = Math.min(logPage, totalLogPages);
  const logPageStart = (clampedLogPage - 1) * pageSize;
  const visibleLogs = logs.slice(logPageStart, logPageStart + pageSize);
  const logPages = Array.from({ length: totalLogPages }, (_, index) => index + 1);

  return (
    <>
      <header className="content__header">
        <div className="content__header-row">
          <h2>딜(기회)</h2>
          <button className="project-form__submit" type="button" onClick={openCreateProjectModal}>
            딜(기회) 등록
          </button>
        </div>
      </header>
      <section className="content__section content__section--split">
        <div className="content__card content__card--wide">
          <div className="content__card-header">
            <h3>딜 프로젝트</h3>
            {selectedSale && (
              <button
                className="ghost-button"
                type="button"
                onClick={() => openEditProjectModal(selectedSale)}
              >
                프로젝트 수정
              </button>
            )}
          </div>
          {salesStatus === 'loading' && <p className="table__status">불러오는 중...</p>}
          {salesStatus === 'error' && (
            <p className="table__status table__status--error">데이터를 불러오지 못했습니다.</p>
          )}
          {salesStatus === 'ready' && sales.length === 0 && (
            <p className="table__status">데이터가 없습니다.</p>
          )}
          {salesStatus === 'ready' && sales.length > 0 && (
            <div className="table__wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    {salesProjectColumns.map((column) => (
                      <th key={column.key}>{column.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleSales.map((item) => (
                    <tr
                      key={item.id}
                      className={`data-table__row${
                        selectedSaleId === item.id ? ' data-table__row--active' : ''
                      }`}
                      onClick={() => setSelectedSaleId(item.id)}
                      onDoubleClick={() => openEditProjectModal(item)}
                    >
                      {salesProjectColumns.map((column) => {
                        if (column.key === 'source') {
                          const source = item[column.key] ?? '';
                          const badgeLabel = sourceInitialMap[source] || (source ? source[0].toUpperCase() : '-');
                          const badgeClass = sourceClassMap[source] || 'default';
                          return (
                            <td key={column.key}>
                              <span className={`source-badge source-badge--${badgeClass}`}>
                                {badgeLabel || '-'}
                              </span>
                            </td>
                          );
                        }
                        return <td key={column.key}>{item[column.key] ?? ''}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {salesStatus === 'ready' && sales.length > pageSize && (
            <div className="pagination">
              <button
                className="icon-button"
                type="button"
                onClick={() => setProjectPage((prev) => Math.max(1, prev - 1))}
                disabled={clampedProjectPage === 1}
                aria-label="이전 페이지"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15.5 19l-7-7 7-7" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
              <div className="pagination__pages">
                {projectPages.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    className={`pagination__page${
                      pageNumber === clampedProjectPage ? ' pagination__page--active' : ''
                    }`}
                    type="button"
                    onClick={() => setProjectPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={() => setProjectPage((prev) => Math.min(totalProjectPages, prev + 1))}
                disabled={clampedProjectPage === totalProjectPages}
                aria-label="다음 페이지"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.5 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
            </div>
          )}
        </div>
        <div className="content__card content__card--wide">
          <div className="content__card-header">
            <div>
                <h3>딜 로그</h3>
              {selectedSale && (
                <p className="content__card-subtitle">
                  {selectedSale.company} · {selectedSale.project}
                </p>
              )}
            </div>
            <button
              className="project-form__submit"
              type="button"
              onClick={openCreateLogModal}
              disabled={!selectedSaleId}
            >
              로그 등록
            </button>
          </div>
          {!selectedSaleId && <p className="table__status">프로젝트를 선택하세요.</p>}
          {selectedSaleId && logsStatus === 'loading' && <p className="table__status">불러오는 중...</p>}
          {selectedSaleId && logsStatus === 'error' && (
            <p className="table__status table__status--error">로그를 불러오지 못했습니다.</p>
          )}
          {selectedSaleId && logsStatus === 'ready' && logs.length === 0 && (
            <p className="table__status">로그가 없습니다.</p>
          )}
          {selectedSaleId && logsStatus === 'ready' && logs.length > 0 && (
            <div className="table__wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    {salesLogColumns.map((column) => (
                      <th key={column.key}>{column.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleLogs.map((item) => (
                    <tr key={item.id} className="data-table__row" onClick={() => openEditLogModal(item)}>
                      {salesLogColumns.map((column) => {
                        if (
                          column.key === 'expected_close_date' ||
                          column.key === 'actual_close_date' ||
                          column.key === 'next_action_date' ||
                          column.key === 'created_at'
                        ) {
                          return <td key={column.key}>{formatDate(item[column.key])}</td>;
                        }
                        if (column.key === 'expected_amount' || column.key === 'weighted_amount') {
                          return <td key={column.key}>{formatAmount(item[column.key])}</td>;
                        }
                        if (column.key === 'priority') {
                          const value = item[column.key] ?? '';
                          const colorClass = priorityClassMap[value] || 'priority-default';
                          return (
                            <td key={column.key}>
                              <span className={`status-text ${colorClass}`}>{value || '-'}</span>
                            </td>
                          );
                        }
                        if (column.key === 'risk') {
                          const value = item[column.key] ?? '';
                          const colorClass = riskClassMap[value] || 'risk-default';
                          return (
                            <td key={column.key}>
                              <span className={`status-text ${colorClass}`}>{value || '-'}</span>
                            </td>
                          );
                        }
                        return <td key={column.key}>{item[column.key] ?? ''}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {selectedSaleId && logsStatus === 'ready' && logs.length > pageSize && (
            <div className="pagination">
              <button
                className="icon-button"
                type="button"
                onClick={() => setLogPage((prev) => Math.max(1, prev - 1))}
                disabled={clampedLogPage === 1}
                aria-label="이전 페이지"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15.5 19l-7-7 7-7" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
              <div className="pagination__pages">
                {logPages.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    className={`pagination__page${pageNumber === clampedLogPage ? ' pagination__page--active' : ''}`}
                    type="button"
                    onClick={() => setLogPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={() => setLogPage((prev) => Math.min(totalLogPages, prev + 1))}
                disabled={clampedLogPage === totalLogPages}
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
      {isProjectModalOpen && (
        <div className="modal">
          <div className="modal__overlay" onClick={closeProjectModal} />
          <div className="modal__content" role="dialog" aria-modal="true">
            <div className="modal__header">
              <div className="modal__title-row modal__title-row--spaced">
              <h3>{editingProjectId ? '딜(기회) 수정' : '딜(기회) 등록'}</h3>
                <button className="icon-button" type="button" onClick={closeProjectModal} aria-label="닫기">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6.4 5l12.6 12.6-1.4 1.4L5 6.4 6.4 5z" />
                    <path d="M19 6.4 6.4 19l-1.4-1.4L17.6 5 19 6.4z" />
                  </svg>
                </button>
              </div>
            </div>
            <form className="project-form modal__body" onSubmit={handleProjectSubmit}>
              {salesProjectFields.map((field) => (
                <label className="project-form__field" htmlFor={`sales-${field.name}`} key={field.name}>
                  {field.type === 'textarea' ? (
                    <textarea
                      id={`sales-${field.name}`}
                      name={field.name}
                      rows="4"
                      placeholder=" "
                      value={projectFormData[field.name] ?? ''}
                      onChange={(event) => handleProjectChange(field.name, event.target.value)}
                    />
                  ) : field.type === 'select' ? (
                    (() => {
                      const selectedValue = projectFormData[field.name] ?? field.options?.[0] ?? '';
                      return (
                    <select
                      id={`sales-${field.name}`}
                      name={field.name}
                          value={selectedValue}
                          data-filled={selectedValue ? 'true' : 'false'}
                      onChange={(event) => handleProjectChange(field.name, event.target.value)}
                    >
                      {field.options?.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                      );
                    })()
                  ) : (
                    <input
                      id={`sales-${field.name}`}
                      name={field.name}
                      type={field.type}
                      placeholder=" "
                      value={projectFormData[field.name] ?? ''}
                      data-filled={
                        field.type === 'date' ? (projectFormData[field.name] ? 'true' : 'false') : undefined
                      }
                      onChange={(event) => {
                        if (field.type === 'date') {
                          event.target.dataset.filled = event.target.value ? 'true' : 'false';
                        }
                        handleProjectChange(field.name, event.target.value);
                      }}
                    />
                  )}
                  <span>{field.label}</span>
                </label>
              ))}
              <div className="form-actions modal__actions">
                <button className="project-form__submit" type="submit" disabled={projectFormStatus === 'saving'}>
                  {editingProjectId ? '저장' : '등록'}
                </button>
                {editingProjectId && (
                  <button
                    className="project-form__submit project-form__submit--danger"
                    type="button"
                    onClick={() => handleProjectDelete({ id: editingProjectId })}
                  >
                    삭제
                  </button>
                )}
              </div>
              {projectFormStatus === 'error' && (
                <p className="table__status table__status--error">저장에 실패했습니다.</p>
              )}
            </form>
          </div>
        </div>
      )}
      {isLogModalOpen && (
        <div className="modal">
          <div className="modal__overlay" onClick={closeLogModal} />
          <div className="modal__content" role="dialog" aria-modal="true">
            <div className="modal__header">
              <div className="modal__title-row modal__title-row--spaced">
              <h3>{editingLogId ? '딜 로그 수정' : '딜 로그 등록'}</h3>
                <button className="icon-button" type="button" onClick={closeLogModal} aria-label="닫기">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6.4 5l12.6 12.6-1.4 1.4L5 6.4 6.4 5z" />
                    <path d="M19 6.4 6.4 19l-1.4-1.4L17.6 5 19 6.4z" />
                  </svg>
                </button>
              </div>
            </div>
            <form className="project-form modal__body" onSubmit={handleLogSubmit}>
              {salesLogFields.map((field) => (
                <label className="project-form__field" htmlFor={`sales-log-${field.name}`} key={field.name}>
                  {field.type === 'textarea' ? (
                    <textarea
                      id={`sales-log-${field.name}`}
                      name={field.name}
                      rows="4"
                      placeholder=" "
                      value={logFormData[field.name] ?? ''}
                      onChange={(event) => handleLogChange(field.name, event.target.value)}
                    />
                  ) : field.type === 'select' ? (
                    (() => {
                      const selectedValue = logFormData[field.name] ?? field.options?.[0] ?? '';
                      return (
                    <select
                      id={`sales-log-${field.name}`}
                      name={field.name}
                          value={selectedValue}
                          data-filled={selectedValue ? 'true' : 'false'}
                      onChange={(event) => handleLogChange(field.name, event.target.value)}
                    >
                      {field.options?.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                      );
                    })()
                  ) : (
                    <input
                      id={`sales-log-${field.name}`}
                      name={field.name}
                      type={field.type}
                      placeholder=" "
                      value={logFormData[field.name] ?? ''}
                      data-filled={field.type === 'date' ? (logFormData[field.name] ? 'true' : 'false') : undefined}
                      onChange={(event) => {
                        if (field.type === 'date') {
                          event.target.dataset.filled = event.target.value ? 'true' : 'false';
                        }
                        handleLogChange(field.name, event.target.value);
                      }}
                    />
                  )}
                  <span>{field.label}</span>
                </label>
              ))}
              <div className="form-actions modal__actions">
                <button className="project-form__submit" type="submit" disabled={logFormStatus === 'saving'}>
                  {editingLogId ? '저장' : '등록'}
                </button>
                {editingLogId && (
                  <button
                    className="project-form__submit project-form__submit--danger"
                    type="button"
                    onClick={() => handleLogDelete({ id: editingLogId })}
                  >
                    삭제
                  </button>
                )}
              </div>
              {logFormStatus === 'error' && (
                <p className="table__status table__status--error">저장에 실패했습니다.</p>
              )}
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirmState.open}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm || handleConfirmCancel}
        onCancel={handleConfirmCancel}
      />
    </>
  );
}

export default SalesPage;
