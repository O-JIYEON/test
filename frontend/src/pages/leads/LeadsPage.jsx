import { useEffect, useMemo, useState } from 'react';
import ConfirmDialog from '../../components/ConfirmDialog';

const API_BASE = `http://${window.location.hostname}:5001`;

const leadStatusOptions = ['신규', '접촉중', '딜전환', '폐기', '보류'];
const sourceOptions = ['전체', '문의(웹/매일)', '소개', '전시/세미나', '재접촉', '콜드', '파트너'];
const productLineOptions = ['전체', 'SI(프로젝트)', '유지보수', 'PoC/데모', '구독/라이센스', 'HW+SW'];
const regionOptions = ['전체', '수도권', '영남', '호남', '충청', '강원', '제주', '해외'];
const segmentOptions = ['전체', 'Enterprise', 'SMB', '공공', '제조', '에너지', '조선/해양', '건설'];

const leadFields = [
  {
    name: 'lead_status',
    label: '리드상태',
    type: 'select',
    options: leadStatusOptions
  },
  { name: 'content', label: '내용', type: 'textarea' },
  { name: 'next_action_date', label: '다음액션일', type: 'date' },
  { name: 'next_action_content', label: '다음액션내용', type: 'textarea' }
];

const customerFields = [
  { name: 'company', label: '회사명', type: 'text' },
  { name: 'owner', label: '담당자', type: 'text' },
  { name: 'contact', label: '연락처', type: 'text' },
  { name: 'email', label: '이메일', type: 'text' },
  { name: 'customer_owner', label: '담당자(영업)', type: 'text' },
  { name: 'source', label: '유입소스', type: 'select', options: sourceOptions },
  { name: 'product_line', label: '제품라인', type: 'select', options: productLineOptions },
  { name: 'region', label: '지역', type: 'select', options: regionOptions },
  { name: 'segment', label: '세그먼트', type: 'select', options: segmentOptions }
];

const leadColumns = [
  { key: 'id', label: 'LeadId' },
  { key: 'company', label: '회사명' },
  { key: 'owner', label: '담당자' },
  { key: 'contact', label: '연락처' },
  { key: 'email', label: '이메일' },
  { key: 'customer_owner', label: '담당자(영업)' },
  { key: 'source', label: '유입소스' },
  { key: 'product_line', label: '제품라인' },
  { key: 'region', label: '지역' },
  { key: 'segment', label: '세그먼트' },
  { key: 'content', label: '내용' },
  { key: 'lead_status', label: '리드상태' },
  { key: 'next_action_date', label: '다음액션일' },
  { key: 'next_action_content', label: '다음액션내용' }
];

const leadStatusClassMap = {
  신규: 'new',
  접촉중: 'contacting',
  딜전환: 'converted',
  폐기: 'lost',
  보류: 'hold'
};

const formatDate = (value) => {
  if (!value) {
    return '';
  }
  const text = String(value);
  return text.length >= 10 ? text.slice(0, 10) : text;
};

const formatLeadId = (lead) => {
  const raw = lead.created_at || '';
  const datePart = raw ? String(raw).slice(0, 10).replace(/-/g, '') : '00000000';
  const seq = String(lead.id ?? 0).padStart(5, '0');
  return `${datePart}-L${seq}`;
};

const getDdayText = (value) => {
  if (!value) {
    return '';
  }
  const normalized = String(value).slice(0, 10);
  const target = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(target.getTime())) {
    return '';
  }
  const today = new Date();
  const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  const diffDays = Math.ceil((target.getTime() - normalizedToday.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    return 'D-0';
  }
  return diffDays > 0 ? `D-${diffDays}` : `D+${Math.abs(diffDays)}`;
};

function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [status, setStatus] = useState('loading');
  const [formData, setFormData] = useState({});
  const [customerForm, setCustomerForm] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [formStatus, setFormStatus] = useState('');
  const [formErrorMessage, setFormErrorMessage] = useState('');
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerListOpen, setCustomerListOpen] = useState(false);
  const [customerHighlightIndex, setCustomerHighlightIndex] = useState(-1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('전체');
  const [sortState, setSortState] = useState({ key: null, direction: null });
  const [confirmState, setConfirmState] = useState({
    open: false,
    message: '',
    onConfirm: null
  });
  const pageSize = 10;

  const customerMap = useMemo(() => {
    return customers.reduce((acc, customer) => {
      acc[customer.id] = customer;
      return acc;
    }, {});
  }, [customers]);

  const loadLeads = async () => {
    try {
      setStatus('loading');
      const response = await fetch(`${API_BASE}/api/leads`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch leads');
      }
      setLeads(data.leads || []);
      setStatus('ready');
      setPage(1);
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/customers`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch customers');
      }
      setCustomers(data.customers || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchAll() {
      try {
        await Promise.all([loadLeads(), loadCustomers()]);
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setStatus('error');
        }
      }
    }
    fetchAll();
    return () => {
      isMounted = false;
    };
  }, []);

  const openCreateModal = () => {
    const defaultProjectId = '';
    setEditingId(null);
    setCustomerQuery('');
    setCustomerListOpen(false);
    setCustomerHighlightIndex(-1);
    setFormData({
      customer_id: defaultProjectId,
      content: '',
      lead_status: leadStatusOptions[0],
      next_action_date: '',
      next_action_content: ''
    });
    setCustomerForm({
      company: '',
      owner: '',
      contact: '',
      email: '',
      customer_owner: '',
      source: sourceOptions[0],
      product_line: productLineOptions[0],
      region: regionOptions[0],
      segment: segmentOptions[0]
    });
    setFormStatus('');
    setFormErrorMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (lead) => {
    const customer = lead.customer_id ? customerMap[lead.customer_id] : null;
    setEditingId(lead.id);
    setCustomerQuery(customer?.company || lead.company || '');
    setCustomerListOpen(false);
    setCustomerHighlightIndex(-1);
    setFormData({
      customer_id: lead.customer_id || '',
      content: lead.content || '',
      lead_status: lead.lead_status || leadStatusOptions[0],
      next_action_date: formatDate(lead.next_action_date),
      next_action_content: lead.next_action_content || ''
    });
    setCustomerForm({
      company: customer?.company || lead.company || '',
      owner: customer?.owner || lead.owner || '',
      contact: customer?.contact || lead.contact || '',
      email: customer?.email || lead.email || '',
      customer_owner: customer?.customer_owner || lead.customer_owner || '',
      source: customer?.source || lead.source || sourceOptions[0],
      product_line: customer?.product_line || lead.product_line || productLineOptions[0],
      region: customer?.region || lead.region || regionOptions[0],
      segment: customer?.segment || lead.segment || segmentOptions[0]
    });
    setFormStatus('');
    setFormErrorMessage('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const showToast = (message) => {
    setToastMessage(message);
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      setToastMessage('');
    }, 1500);
  };

  const handleCustomerInput = (value) => {
    setCustomerQuery(value);
    setCustomerListOpen(true);
    setCustomerHighlightIndex(-1);
    setFormData((prev) => ({ ...prev, customer_id: '' }));
    setCustomerForm({
      company: '',
      owner: '',
      contact: '',
      email: '',
      customer_owner: '',
      source: sourceOptions[0],
      product_line: productLineOptions[0],
      region: regionOptions[0],
      segment: segmentOptions[0]
    });
  };

  const handleCustomerSelect = (customer) => {
    setCustomerQuery(customer.company || '');
    setCustomerListOpen(false);
    setCustomerHighlightIndex(-1);
    setFormData((prev) => ({ ...prev, customer_id: customer.id }));
    setCustomerForm({
      company: customer.company || '',
      owner: customer.owner || '',
      contact: customer.contact || '',
      email: customer.email || '',
      customer_owner: customer.customer_owner || '',
      source: customer.source || sourceOptions[0],
      product_line: customer.product_line || productLineOptions[0],
      region: customer.region || regionOptions[0],
      segment: customer.segment || segmentOptions[0]
    });
  };

  const filteredCustomers = useMemo(() => {
    const query = customerQuery.trim().toLowerCase();
    if (!query) {
      return customers;
    }
    return customers.filter((customer) => String(customer.company || '').toLowerCase().includes(query));
  }, [customers, customerQuery]);

  const submitLead = async () => {
    setFormStatus('saving');
    try {
      const customerId = formData.customer_id;
      if (!customerId) {
        setFormStatus('error');
        setFormErrorMessage('고객을 선택해 주세요.');
        return;
      }

      const leadPayload = { ...formData, customer_id: customerId };
      const response = await fetch(
        editingId ? `${API_BASE}/api/leads/${editingId}` : `${API_BASE}/api/leads`,
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leadPayload)
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save lead');
      }
      await loadLeads();
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({});
      setCustomerForm({});
      setFormStatus('');
      setFormErrorMessage('');
      showToast(editingId ? '리드가 수정되었습니다.' : '리드가 등록되었습니다.');
    } catch (error) {
      console.error(error);
      setFormStatus('error');
      setFormErrorMessage('저장에 실패했습니다.');
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setConfirmState({
      open: true,
      message: editingId ? '리드를 수정하시겠습니까?' : '리드를 등록하시겠습니까?',
      onConfirm: () => {
        submitLead();
        setConfirmState({ open: false, message: '', onConfirm: null });
      }
    });
  };

  const deleteLead = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/leads/${editingId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete lead');
      }
      await loadLeads();
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({});
      setFormStatus('');
      setFormErrorMessage('');
      showToast('리드가 삭제되었습니다.');
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = () => {
    if (!editingId) {
      return;
    }
    setConfirmState({
      open: true,
      message: '리드를 삭제하시겠습니까?',
      onConfirm: () => {
        deleteLead();
        setConfirmState({ open: false, message: '', onConfirm: null });
      }
    });
  };

  const handleConfirmCancel = () => {
    setConfirmState({ open: false, message: '', onConfirm: null });
  };

  const handleSort = (key) => {
    setSortState((prev) => {
      if (prev.key !== key) {
        return { key, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      if (prev.direction === 'desc') {
        return { key: null, direction: null };
      }
      return { key, direction: 'asc' };
    });
    setPage(1);
  };

  const filteredLeads = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesStatus = statusFilter === '전체' || lead.lead_status === statusFilter;
      if (!query) {
        return matchesStatus;
      }
      const company = String(lead.company ?? '').toLowerCase();
      const owner = String(lead.owner ?? '').toLowerCase();
      const matchesQuery = company.includes(query) || owner.includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [leads, searchQuery, statusFilter]);

  const leadStatusSummary = useMemo(() => {
    const summary = leadStatusOptions.reduce((acc, status) => {
      acc[status] = 0;
      return acc;
    }, {});
    leads.forEach((lead) => {
      if (lead?.lead_status && summary[lead.lead_status] !== undefined) {
        summary[lead.lead_status] += 1;
      }
    });
    return { ...summary, total: leads.length };
  }, [leads]);

  const sortedLeads = (() => {
    if (!sortState.key || !sortState.direction) {
      return filteredLeads;
    }
    const sorted = [...filteredLeads];
    const directionFactor = sortState.direction === 'asc' ? 1 : -1;
    sorted.sort((left, right) => {
      const leftValue = left[sortState.key];
      const rightValue = right[sortState.key];
      if (leftValue === null || leftValue === undefined) {
        return 1;
      }
      if (rightValue === null || rightValue === undefined) {
        return -1;
      }
      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        return (leftValue - rightValue) * directionFactor;
      }
      return (
        String(leftValue).localeCompare(String(rightValue), 'ko-KR', {
          numeric: true,
          sensitivity: 'base'
        }) * directionFactor
      );
    });
    return sorted;
  })();

  const totalPages = Math.max(1, Math.ceil(sortedLeads.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const pageStart = (clampedPage - 1) * pageSize;
  const visibleLeads = sortedLeads.slice(pageStart, pageStart + pageSize);
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <>
      <header className="content__header">
        <div className="content__header-row">
          <h2>Leads</h2>
          <div className="lead-header__right">
            <div className="lead-status-summary" aria-label="리드 상태 통계">
              <button
                type="button"
                className={`lead-status-summary__item lead-status-summary__item--total${
                  statusFilter === '전체' ? ' lead-status-summary__item--active' : ''
                }`}
                onClick={() => {
                  setStatusFilter('전체');
                  setPage(1);
                }}
              >
                <span className="lead-status-summary__label">전체</span>
                <span className="lead-status-summary__value lead-status-summary__value--total">
                  {leadStatusSummary.total ?? 0}
                </span>
              </button>
              {leadStatusOptions.map((status) => {
                const statusKey = leadStatusClassMap[status] || 'default';
                const isActive = statusFilter === status;
                return (
                  <button
                    type="button"
                    className={`lead-status-summary__item lead-status-summary__item--${statusKey}${
                      isActive ? ' lead-status-summary__item--active' : ''
                    }`}
                    key={status}
                    onClick={() => {
                      setStatusFilter(status);
                      setPage(1);
                    }}
                  >
                    <span className="lead-status-summary__label">{status}</span>
                    <span className={`lead-status-summary__value lead-status-summary__value--${statusKey}`}>
                      {leadStatusSummary[status] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>
      <section className="content__section content__section--single">
        <div className="content__card content__card--wide content__card--plain filter-card">
          <div className="filter-row">
            <form className="project-form filter-form" onSubmit={(event) => event.preventDefault()}>
              <div className="filter-form__fields">
                <label className="project-form__field" htmlFor="lead-status-filter">
                  <select
                    id="lead-status-filter"
                    name="lead-status-filter"
                    value={statusFilter}
                    data-filled={statusFilter ? 'true' : 'false'}
                    onChange={(event) => {
                      setStatusFilter(event.target.value);
                      setPage(1);
                    }}
                  >
                    {['전체', ...leadStatusOptions].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <span>리드상태</span>
                </label>
                <label className="project-form__field filter-form__field--wide" htmlFor="lead-search">
                  <input
                    id="lead-search"
                    name="lead-search"
                    type="text"
                    placeholder=" "
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setPage(1);
                    }}
                  />
                  <span>검색 (회사, 담당자)</span>
                </label>
              </div>
            </form>
            <div className="filter-row__actions">
              <button className="project-form__submit" type="button" onClick={openCreateModal}>
                리드 등록
              </button>
            </div>
          </div>
        </div>
      </section>
      <section className="content__section content__section--single">
        <div className="content__card content__card--wide">
          {status === 'loading' && <p className="table__status">불러오는 중...</p>}
          {status === 'error' && (
            <p className="table__status table__status--error">데이터를 불러오지 못했습니다.</p>
          )}
          {status === 'ready' && leads.length === 0 && <p className="table__status">데이터가 없습니다.</p>}
          {status === 'ready' && leads.length > 0 && sortedLeads.length === 0 && (
            <p className="table__status">조건에 맞는 데이터가 없습니다.</p>
          )}
          {status === 'ready' && sortedLeads.length > 0 && (
            <div className="table__wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    {leadColumns.map((column) => (
                      <th
                        key={column.key}
                        className={
                          ['owner', 'contact', 'email'].includes(column.key) ? 'lead-table__optional' : ''
                        }
                      >
                        <button
                          className="table-sort"
                          type="button"
                          onClick={() => handleSort(column.key)}
                        >
                          {column.label}
                          <span className="table-sort__icon">
                            {sortState.key === column.key
                              ? sortState.direction === 'asc'
                                ? '▲'
                                : sortState.direction === 'desc'
                                  ? '▼'
                                  : ''
                              : ''}
                          </span>
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleLeads.map((lead) => (
                    <tr key={lead.id} className="data-table__row" onClick={() => openEditModal(lead)}>
                      {leadColumns.map((column) => {
                        const cellClassName = ['owner', 'contact', 'email'].includes(column.key)
                          ? 'lead-table__optional'
                          : '';
                        if (column.key === 'id') {
                          return (
                            <td key={column.key} className={cellClassName}>
                              {formatLeadId(lead)}
                            </td>
                          );
                        }
                        if (column.key === 'next_action_date') {
                          const formatted = formatDate(lead[column.key]);
                          const status = lead.lead_status;
                          const dday =
                            status === '신규' || status === '접촉중' ? getDdayText(lead[column.key]) : '';
                          const urgent = dday.startsWith('D-') && Number(dday.slice(2)) <= 5;
                          return (
                            <td key={column.key} className={cellClassName}>
                              {formatted}
                              {dday && (
                                <span className={`lead-dday${urgent ? ' lead-dday--urgent' : ''}`}>
                                  ({dday})
                                </span>
                              )}
                            </td>
                          );
                        }
                        if (column.key === 'lead_status') {
                          const statusKey = leadStatusClassMap[lead[column.key]] || 'default';
                          return (
                            <td key={column.key} className={cellClassName}>
                              <span className={`lead-badge lead-badge--${statusKey}`}>
                                {lead[column.key] ?? '-'}
                              </span>
                            </td>
                          );
                        }
                        if (column.key === 'email') {
                          const email = lead[column.key] ?? '';
                          return (
                            <td key={column.key} className={cellClassName}>
                              {email ? (
                                <span className="email-icon-wrapper">
                                  <button
                                    className="icon-button"
                                    type="button"
                                    aria-label="이메일 복사"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      navigator.clipboard?.writeText(email);
                                      showToast('이메일이 복사되었습니다.');
                                    }}
                                  >
                                    <svg viewBox="0 0 24 24" aria-hidden="true">
                                      <path
                                        d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.6"
                                      />
                                      <path
                                        d="M22 8 12 14 2 8"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.6"
                                        strokeLinecap="round"
                                      />
                                    </svg>
                                  </button>
                                  <span className="email-tooltip">{email}</span>
                                </span>
                              ) : (
                                ''
                              )}
                            </td>
                          );
                        }
                        return (
                          <td key={column.key} className={cellClassName}>
                            {lead[column.key] ?? ''}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {status === 'ready' && (
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
      {isModalOpen && (
        <div className="modal">
          <div className="modal__overlay" onClick={closeModal} />
          <div className="modal__content" role="dialog" aria-modal="true">
            <div className="modal__header">
              <div className="modal__title-row modal__title-row--spaced">
                <h3>{editingId ? '리드 수정' : '리드 등록'}</h3>
                <button className="icon-button" type="button" onClick={closeModal} aria-label="닫기">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6.4 5l12.6 12.6-1.4 1.4L5 6.4 6.4 5z" />
                    <path d="M19 6.4 6.4 19l-1.4-1.4L17.6 5 19 6.4z" />
                  </svg>
                </button>
              </div>
            </div>
            <form className="project-form modal__body lead-form" onSubmit={handleSubmit}>
              <div className="lead-form__grid">
                <div className="lead-form__column">
                  <label className="project-form__field lead-customer-select" htmlFor="lead-customer-search">
                    <input
                      id="lead-customer-search"
                      name="lead-customer-search"
                      type="text"
                      placeholder=" "
                      value={customerQuery}
                      onChange={(event) => {
                        if (editingId) {
                          return;
                        }
                        handleCustomerInput(event.target.value);
                      }}
                      onFocus={() => {
                        if (!editingId) {
                          setCustomerListOpen(true);
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => setCustomerListOpen(false), 120);
                      }}
                      onKeyDown={(event) => {
                        if (!customerListOpen) {
                          return;
                        }
                        if (event.key === 'ArrowDown') {
                          event.preventDefault();
                          setCustomerHighlightIndex((prev) =>
                            Math.min(filteredCustomers.length - 1, prev + 1)
                          );
                        } else if (event.key === 'ArrowUp') {
                          event.preventDefault();
                          setCustomerHighlightIndex((prev) => Math.max(-1, prev - 1));
                        } else if (event.key === 'Enter') {
                          if (customerHighlightIndex >= 0) {
                            event.preventDefault();
                            const selected = filteredCustomers[customerHighlightIndex];
                            if (selected) {
                              handleCustomerSelect(selected);
                            }
                          }
                        } else if (event.key === 'Escape') {
                          setCustomerListOpen(false);
                        }
                      }}
                      readOnly={Boolean(editingId)}
                    />
                    <span>회사명</span>
                    {!editingId && customerListOpen && (
                      <div className="lead-customer-select__list" role="listbox">
                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map((customer, index) => (
                            <button
                              type="button"
                              key={customer.id}
                              className={`lead-customer-select__option${
                                index === customerHighlightIndex ? ' lead-customer-select__option--active' : ''
                              }`}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => handleCustomerSelect(customer)}
                            >
                              {customer.company}
                            </button>
                          ))
                        ) : (
                          <div className="lead-customer-select__empty">결과 없음</div>
                        )}
                      </div>
                    )}
                  </label>
                  {customerFields
                    .filter((field) => field.name !== 'company')
                    .map((field) => (
                      <label className="project-form__field" htmlFor={`lead-customer-${field.name}`} key={field.name}>
                        {field.type === 'select' ? (
                          <select
                            id={`lead-customer-${field.name}`}
                            name={field.name}
                            value={customerForm[field.name] ?? field.options[0]}
                            data-filled={customerForm[field.name] ? 'true' : 'false'}
                            disabled
                          >
                            {field.options.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            id={`lead-customer-${field.name}`}
                            name={field.name}
                            type={field.type}
                            placeholder=" "
                            value={customerForm[field.name] ?? ''}
                            readOnly
                          />
                        )}
                        <span>{field.label}</span>
                      </label>
                    ))}
                </div>
                <div className="lead-form__column">
                  {leadFields.map((field) => (
                    <label className="project-form__field" htmlFor={`lead-${field.name}`} key={field.name}>
                      {field.type === 'textarea' ? (
                        <textarea
                          id={`lead-${field.name}`}
                          name={field.name}
                          rows="4"
                          placeholder=" "
                          value={formData[field.name] ?? ''}
                          onChange={(event) => handleChange(field.name, event.target.value)}
                        />
                      ) : field.type === 'select' ? (
                        <select
                          id={`lead-${field.name}`}
                          name={field.name}
                          value={formData[field.name] ?? ''}
                          data-filled={formData[field.name] ? 'true' : 'false'}
                          onChange={(event) => handleChange(field.name, event.target.value)}
                        >
                          {field.options?.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id={`lead-${field.name}`}
                          name={field.name}
                          type={field.type}
                          placeholder=" "
                          value={formData[field.name] ?? ''}
                          data-filled={field.type === 'date' ? (formData[field.name] ? 'true' : 'false') : undefined}
                          onChange={(event) => {
                            if (field.type === 'date') {
                              event.target.dataset.filled = event.target.value ? 'true' : 'false';
                            }
                            handleChange(field.name, event.target.value);
                          }}
                        />
                      )}
                      <span>{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-actions modal__actions">
                <button className="project-form__submit" type="submit" disabled={formStatus === 'saving'}>
                  {editingId ? '저장' : '등록'}
                </button>
                {editingId && (
                  <button
                    className="project-form__submit project-form__submit--danger"
                    type="button"
                    onClick={handleDelete}
                  >
                    삭제
                  </button>
                )}
              </div>
              {formStatus === 'error' && (
                <p className="table__status table__status--error">{formErrorMessage}</p>
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
      {toastMessage && <div className="toast">{toastMessage}</div>}
    </>
  );
}

export default LeadsPage;
