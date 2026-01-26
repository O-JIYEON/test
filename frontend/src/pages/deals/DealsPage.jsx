import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ConfirmDialog from '../../components/ConfirmDialog';

const API_BASE = `http://${window.location.hostname}:5001`;

const defaultStageOptions = [
  '자격확인(가능성판단)',
  '요구사항/기술검토',
  '제안/견적',
  '협상/계약',
  '수주',
  '실주'
];
const dealStatusOptions = ['전체', '진행', '수주', '실주'];
const leadStatusOptions = ['신규', '접촉중', '딜전환', '폐기', '보류'];
const sourceOptions = ['전체', '문의(웹/매일)', '소개', '전시/세미나', '재접촉', '콜드', '파트너'];
const productLineOptions = ['전체', 'SI(프로젝트)', '유지보수', 'PoC/데모', '구독/라이센스', 'HW+SW'];
const regionOptions = ['전체', '수도권', '영남', '호남', '충청', '강원', '제주', '해외'];
const segmentOptions = ['전체', 'Enterprise', 'SMB', '공공', '제조', '에너지', '조선/해양', '건설'];

const leadCustomerFields = [
  { name: 'business_registration_number', label: '사업자 등록증번호', type: 'text' },
  { name: 'company', label: '회사명', type: 'text' },
  { name: 'owner', label: '담당자', type: 'text' },
  { name: 'contact', label: '연락처', type: 'text' },
  { name: 'email', label: '이메일', type: 'text' }
];

const leadDetailFields = [
  { name: 'customer_owner', label: '담당자(영업)', type: 'text' },
  { name: 'source', label: '유입소스', type: 'select', options: sourceOptions },
  { name: 'product_line', label: '제품라인', type: 'select', options: productLineOptions },
  { name: 'region', label: '지역', type: 'select', options: regionOptions },
  { name: 'segment', label: '세그먼트', type: 'select', options: segmentOptions },
  { name: 'lead_status', label: '리드상태', type: 'select', options: leadStatusOptions },
  { name: 'content', label: '내용', type: 'textarea' },
  { name: 'next_action_date', label: '다음액션일', type: 'date' },
  { name: 'next_action_content', label: '다음액션내용', type: 'textarea' }
];

const leadModalLeftFields = [
  { name: 'lead_code', label: 'Lead Id' },
  { name: 'company', label: '회사명' },
  { name: 'owner', label: '담당자' },
  { name: 'contact', label: '연락처' },
  { name: 'email', label: '이메일' },
  { name: 'customer_owner', label: '담당자(영업)' },
  { name: 'source', label: '유입소스' },
  { name: 'product_line', label: '제품라인' },
  { name: 'region', label: '지역' },
  { name: 'segment', label: '세그먼트' }
];

const leadModalRightFields = [
  { name: 'lead_status', label: '리드상태' },
  { name: 'content', label: '내용' },
  { name: 'next_action_date', label: '다음액션일', type: 'date' },
  { name: 'next_action_content', label: '다음액션내용' }
];

const defaultProbabilityByStage = {
  '자격확인(가능성판단)': 10,
  '요구사항/기술검토': 25,
  '제안/견적': 50,
  '협상/계약': 75,
  수주: 100,
  실주: 0
};

const lossReasonOptions = ['가격', '경쟁사', '일정', '기술부적합', '예산 없음', '내부우선순위 변경', '기타'];

const dealColumns = [
  { key: 'lead_code', label: 'Lead Id' },
  { key: 'deal_code', label: 'Deal Id' },
  { key: 'created_at', label: '생성일' },
  { key: 'company', label: '회사명' },
  { key: 'owner', label: '담당자' },
  { key: 'project_name', label: '프로젝트/건명' },
  { key: 'customer_owner', label: '담당자(영업)' },
  { key: 'stage', label: '딜단계' },
  { key: 'expected_amount', label: '예상금액(원)' },
  { key: 'probability', label: '확률' },
  { key: 'weighted_amount', label: '가중금액(원)' },
  { key: 'expected_close_date', label: '예상수주일' },
  { key: 'won_date', label: '수주확정일' },
  { key: 'status', label: '상태' },
  { key: 'next_action_date', label: '다음액션일' },
  { key: 'next_action_content', label: '다음액션내용' },
  { key: 'loss_reason', label: '실주사유' },
  { key: 'inactive_days', label: '무활동일수' }
];

const formatDate = (value) => {
  if (!value) {
    return '';
  }
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }
  if (text.includes('T') || text.includes(' ')) {
    return text.slice(0, 10);
  }
  return text.length >= 10 ? text.slice(0, 10) : text;
};

const formatAmount = (value) => {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  const numberValue = Number(String(value).replace(/,/g, ''));
  if (Number.isNaN(numberValue)) {
    return value;
  }
  return numberValue.toLocaleString('ko-KR');
};

const computeStatus = (stage) => {
  if (stage === '수주') {
    return '수주';
  }
  if (stage === '실주') {
    return '실주';
  }
  return '진행';
};

const getInactiveDays = (nextActionDate) => {
  if (!nextActionDate) {
    return 0;
  }
  const dateValue = new Date(String(nextActionDate).slice(0, 10) + 'T00:00:00');
  if (Number.isNaN(dateValue.getTime())) {
    return 0;
  }
  const today = new Date();
  const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  const diffTime = normalizedToday.getTime() - dateValue.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
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

function DealsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const lastOpenedRef = useRef(null);
  const [deals, setDeals] = useState([]);
  const [leads, setLeads] = useState([]);
  const [lookupValues, setLookupValues] = useState([]);
  const [status, setStatus] = useState('loading');
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [formStatus, setFormStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [activityLogs, setActivityLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [stageFilter, setStageFilter] = useState('전체');
  const [statusFilter, setStatusFilter] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmState, setConfirmState] = useState({
    open: false,
    message: '',
    onConfirm: null
  });
  const pageSize = 10;

  const lookupOptions = useMemo(() => {
    const map = lookupValues.reduce((acc, value) => {
      const key = value.category_label || '';
      if (!key) {
        return acc;
      }
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(value.label);
      return acc;
    }, {});
    return map;
  }, [lookupValues]);

  const stageOptions = useMemo(() => {
    const options = lookupOptions['파이프라인 단계'] || lookupOptions['딜단계'];
    return options?.length ? options : defaultStageOptions;
  }, [lookupOptions]);

  const probabilityByStage = useMemo(() => {
    const stageValues = lookupValues.filter(
      (value) => value.category_label === '파이프라인 단계' || value.category_label === '딜단계'
    );
    if (!stageValues.length) {
      return defaultProbabilityByStage;
    }
    const map = stageValues.reduce((acc, value) => {
      if (value?.label) {
        const rawProbability = value.probability;
        if (rawProbability !== null && rawProbability !== undefined && rawProbability !== '') {
          acc[value.label] = Number(rawProbability);
        }
      }
      return acc;
    }, {});
    return Object.keys(map).length ? map : defaultProbabilityByStage;
  }, [lookupValues]);

  const dealFields = useMemo(
    () => [
      { name: 'lead_id', label: 'Lead Id', type: 'select' },
      { name: 'project_name', label: '프로젝트/건명', type: 'text' },
      { name: 'stage', label: '딜단계', type: 'select', options: stageOptions },
      { name: 'expected_amount', label: '예상금액(원)', type: 'number' },
      { name: 'expected_close_date', label: '예상수주일', type: 'date' },
      { name: 'won_date', label: '수주확정일', type: 'date' },
      { name: 'next_action_date', label: '다음액션일', type: 'date' },
      { name: 'next_action_content', label: '다음액션내용', type: 'textarea' },
      { name: 'loss_reason', label: '실주사유', type: 'select', options: lossReasonOptions }
    ],
    [stageOptions]
  );

  const showToast = (message, type = 'success') => {
    setToastType(type);
    setToastMessage(message);
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      setToastMessage('');
    }, 1500);
  };

  const leadMap = useMemo(() => {
    return leads.reduce((acc, lead) => {
      acc[lead.id] = lead;
      return acc;
    }, {});
  }, [leads]);

  const loadDeals = async () => {
    try {
      setStatus('loading');
      const response = await fetch(`${API_BASE}/api/deals`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch deals');
      }
      setDeals(data.deals || []);
      setStatus('ready');
      setPage(1);
    } catch (error) {
      console.error(error);
      setStatus('error');
      showToast('데이터를 불러오지 못했습니다.');
    }
  };

  const loadLeads = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/leads`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch leads');
      }
      setLeads(data.leads || []);
    } catch (error) {
      console.error(error);
      showToast('리드 데이터를 불러오지 못했습니다.');
    }
  };

  const loadActivityLogs = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/activity-logs`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch activity logs');
      }
      setActivityLogs(data.logs || []);
    } catch (error) {
      console.error(error);
      showToast('활동 기록을 불러오지 못했습니다.');
    }
  };

  const loadLookupValues = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/lookup-values`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch lookup values');
      }
      setLookupValues(data.values || []);
    } catch (error) {
      console.error(error);
      showToast('설정 값을 불러오지 못했습니다.');
    }
  };

  useEffect(() => {
    loadDeals();
    loadLeads();
    loadActivityLogs();
    loadLookupValues();
  }, []);

  useEffect(() => {
    const openDealId = location.state?.openDealId;
    if (!openDealId || status !== 'ready') {
      return;
    }
    if (lastOpenedRef.current === openDealId) {
      return;
    }
    const target = deals.find((deal) => String(deal.id) === String(openDealId));
    if (target) {
      lastOpenedRef.current = openDealId;
      openEditModal(target);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, status, deals, navigate, location.pathname]);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      lead_id: '',
      project_name: '',
      stage: stageOptions[0],
      expected_amount: '',
      expected_close_date: '',
      won_date: '',
      next_action_date: '',
      next_action_content: '',
      loss_reason: ''
    });
    setFormStatus('');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (deal) => {
    setEditingId(deal.id);
    const formattedExpectedAmount = formatAmount(deal.expected_amount);
    setFormData({
      lead_id: deal.lead_id ?? '',
      lead_code: deal.lead_code ?? '',
      project_name: deal.project_name || '',
      stage: deal.stage || '',
      expected_amount: formattedExpectedAmount || '',
      expected_close_date: formatDate(deal.expected_close_date),
      won_date: formatDate(deal.won_date),
      next_action_date: formatDate(deal.next_action_date),
      next_action_content: deal.next_action_content || '',
      loss_reason: deal.loss_reason || ''
    });
    setFormStatus('');
    setErrorMessage('');
    setIsModalOpen(true);
    loadActivityLogs();
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const openLeadModal = (lead) => {
    setSelectedLead(lead);
    setIsLeadModalOpen(true);
  };

  const closeLeadModal = () => {
    setIsLeadModalOpen(false);
    setSelectedLead(null);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const submitDeal = async () => {
    setFormStatus('saving');
    try {
      const payload = {
        ...formData,
        expected_amount:
          formData.expected_amount !== undefined && formData.expected_amount !== null
            ? String(formData.expected_amount).replace(/,/g, '')
            : formData.expected_amount
      };
      const response = await fetch(
        editingId ? `${API_BASE}/api/deals/${editingId}` : `${API_BASE}/api/deals`,
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save deal');
      }
      await loadDeals();
      await loadActivityLogs();
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({});
      setFormStatus('');
      setErrorMessage('');
      showToast(editingId ? '저장되었습니다.' : '등록되었습니다.', 'success');
    } catch (error) {
      console.error(error);
      setFormStatus('error');
      setErrorMessage('저장에 실패했습니다.');
      showToast('저장에 실패했습니다.', 'error');
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setConfirmState({
      open: true,
      message: editingId ? '딜 정보를 수정하시겠습니까?' : '딜 정보를 등록하시겠습니까?',
      onConfirm: () => {
        submitDeal();
        setConfirmState({ open: false, message: '', onConfirm: null });
      }
    });
  };

  const deleteDeal = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/deals/${editingId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete deal');
      }
      await loadDeals();
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({});
      setFormStatus('');
      setErrorMessage('');
      showToast('삭제되었습니다.', 'success');
    } catch (error) {
      console.error(error);
      setErrorMessage('삭제에 실패했습니다.');
      showToast('삭제에 실패했습니다.', 'error');
    }
  };

  const handleDelete = () => {
    if (!editingId) {
      return;
    }
    setConfirmState({
      open: true,
      message: '딜 정보를 삭제하시겠습니까?',
      onConfirm: () => {
        deleteDeal();
        setConfirmState({ open: false, message: '', onConfirm: null });
      }
    });
  };

  const handleConfirmCancel = () => {
    setConfirmState({ open: false, message: '', onConfirm: null });
  };

  const enrichedDeals = useMemo(() => {
    return deals.map((deal) => {
      const stage = deal.stage || stageOptions[0];
      const probability = probabilityByStage[stage] ?? 0;
      const expectedAmount = Number(String(deal.expected_amount ?? '').replace(/,/g, '')) || 0;
      const weightedAmount = Math.round((expectedAmount * probability) / 100);
      return {
        ...deal,
        probability: `${probability}%`,
        weighted_amount: weightedAmount,
        status: computeStatus(stage),
        inactive_days: getInactiveDays(deal.next_action_date)
      };
    });
  }, [deals, probabilityByStage, stageOptions]);

  const dealLeadInfo = useMemo(() => {
    if (!editingId || !formData.lead_id) {
      return null;
    }
    return leads.find((lead) => String(lead.id) === String(formData.lead_id)) || null;
  }, [editingId, formData.lead_id, leads]);

  const dealLogs = useMemo(() => {
    if (!editingId) {
      return [];
    }
    return activityLogs.filter((log) => String(log.deal_id) === String(editingId));
  }, [activityLogs, editingId]);

  const dealStatusSummary = useMemo(() => {
    return enrichedDeals.reduce(
      (acc, deal) => {
        acc.total += 1;
        if (deal.status === '수주') {
          acc.수주 += 1;
        } else if (deal.status === '실주') {
          acc.실주 += 1;
        } else {
          acc.진행 += 1;
        }
        return acc;
      },
      { total: 0, 진행: 0, 수주: 0, 실주: 0 }
    );
  }, [enrichedDeals]);

  const filteredDeals = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return enrichedDeals.filter((deal) => {
      const matchesStage = stageFilter === '전체' || !stageFilter || deal.stage === stageFilter;
      const matchesStatus = statusFilter === '전체' || !statusFilter || deal.status === statusFilter;
      if (!query) {
        return matchesStage && matchesStatus;
      }
      const company = String(deal.company ?? '').toLowerCase();
      const projectName = String(deal.project_name ?? '').toLowerCase();
      const dealCode = String(deal.deal_code ?? '').toLowerCase();
      const matchesQuery =
        company.includes(query) || projectName.includes(query) || dealCode.includes(query);
      return matchesStage && matchesStatus && matchesQuery;
    });
  }, [enrichedDeals, stageFilter, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredDeals.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const pageStart = (clampedPage - 1) * pageSize;
  const visibleDeals = filteredDeals.slice(pageStart, pageStart + pageSize);
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  const showLeadPanel = Boolean(editingId && dealLeadInfo);
  const showLogPanel = Boolean(editingId);
  const modalLayoutClass = showLeadPanel
    ? 'deal-modal__body--triple'
    : showLogPanel
      ? 'deal-modal__body--double'
      : 'deal-modal__body--single';
  const modalSizeClass = showLeadPanel ? 'deal-modal__content--wide' : '';

  return (
    <>
      <header className="content__header">
        <div className="content__header-row">
          <h2>딜(기회)</h2>
          <div className="lead-header__right">
          <div className="lead-status-summary" aria-label="딜 상태 통계">
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
                  {dealStatusSummary.total}
                </span>
              </button>
              <button
                type="button"
                className={`lead-status-summary__item${
                  statusFilter === '진행' ? ' lead-status-summary__item--active' : ''
                }`}
                onClick={() => {
                  setStatusFilter(statusFilter === '진행' ? '전체' : '진행');
                  setPage(1);
                }}
              >
                <span className="lead-status-summary__label">진행</span>
                <span className="lead-status-summary__value lead-status-summary__value--progress">
                  {dealStatusSummary.진행}
                </span>
              </button>
              <button
                type="button"
                className={`lead-status-summary__item${
                  statusFilter === '수주' ? ' lead-status-summary__item--active' : ''
                }`}
                onClick={() => {
                  setStatusFilter(statusFilter === '수주' ? '전체' : '수주');
                  setPage(1);
                }}
              >
                <span className="lead-status-summary__label">수주</span>
                <span className="lead-status-summary__value lead-status-summary__value--won">
                  {dealStatusSummary.수주}
                </span>
              </button>
              <button
                type="button"
                className={`lead-status-summary__item${
                  statusFilter === '실주' ? ' lead-status-summary__item--active' : ''
                }`}
                onClick={() => {
                  setStatusFilter(statusFilter === '실주' ? '전체' : '실주');
                  setPage(1);
                }}
              >
                <span className="lead-status-summary__label">실주</span>
                <span className="lead-status-summary__value lead-status-summary__value--lost">
                  {dealStatusSummary.실주}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>
      <section className="content__section content__section--single deals-section">
        <div className="filter-row">
          <form className="project-form filter-form" onSubmit={(event) => event.preventDefault()}>
            <div className="filter-form__fields">
              <label className="project-form__field deal-filter__stage" htmlFor="deal-stage-filter">
                <select
                  id="deal-stage-filter"
                  name="deal-stage-filter"
                  value={stageFilter}
                  data-filled={stageFilter ? 'true' : 'false'}
                  onChange={(event) => {
                    setStageFilter(event.target.value);
                    setPage(1);
                  }}
                >
                  {['전체', ...stageOptions].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <span>단계</span>
              </label>
              <label className="project-form__field" htmlFor="deal-status-filter">
                <select
                  id="deal-status-filter"
                  name="deal-status-filter"
                  value={statusFilter}
                  data-filled={statusFilter ? 'true' : 'false'}
                  onChange={(event) => {
                    setStatusFilter(event.target.value);
                    setPage(1);
                  }}
                >
                  {dealStatusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <span>상태</span>
              </label>
              <label className="project-form__field filter-form__field--wide" htmlFor="deal-search">
                <input
                  id="deal-search"
                  name="deal-search"
                  type="text"
                  placeholder=" "
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setPage(1);
                  }}
                />
                <span>검색 (회사, 프로젝트, Deal Id)</span>
              </label>
            </div>
          </form>
          <div className="filter-row__actions">
            <button className="project-form__submit" type="button" onClick={openCreateModal}>
              등록
            </button>
          </div>
        </div>
        <div className="content__card content__card--wide">
          {status === 'loading' && <p className="table__status">불러오는 중...</p>}
          {status === 'error' && null}
          {status === 'ready' && (
            <div className="table__wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    {dealColumns.map((column) => {
                      const headerClassName =
                        column.key === 'created_at' || column.key === 'owner'
                          ? 'deal-table__hide'
                          : '';
                      return (
                        <th key={column.key} className={headerClassName}>
                          {column.label}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filteredDeals.length === 0 && (
                    <tr className="data-table__row data-table__row--empty">
                      <td colSpan={dealColumns.length} className="data-table__empty">
                        데이터가 없습니다.
                      </td>
                    </tr>
                  )}
                  {filteredDeals.length > 0 && visibleDeals.map((deal) => (
                    <tr
                      key={deal.id}
                      className={`data-table__row${deal.status === '실주' ? ' data-table__row--disabled' : ''}`}
                      onClick={() => openEditModal(deal)}
                    >
                      {dealColumns.map((column) => {
                        const cellClassName =
                          column.key === 'created_at' || column.key === 'owner'
                            ? 'deal-table__hide'
                            : '';
                        if (column.key === 'lead_code') {
                          const leadRecord = leadMap[deal.lead_id] || deal;
                          const isLeadDeleted = Boolean(deal.lead_deleted_at);
                          return (
                            <td key={column.key} className={cellClassName}>
                              {isLeadDeleted ? (
                                <span className="table-link table-link--disabled">
                                  {deal[column.key] ?? ''}
                                </span>
                              ) : (
                                <button
                                  className="table-link"
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openLeadModal(leadRecord);
                                  }}
                                >
                                  {deal[column.key] ?? ''}
                                </button>
                              )}
                            </td>
                          );
                        }
                        if (column.key === 'expected_amount' || column.key === 'weighted_amount') {
                          return (
                            <td key={column.key} className={cellClassName}>
                              {formatAmount(deal[column.key])}
                            </td>
                          );
                        }
                        if (
                          column.key === 'created_at' ||
                          column.key === 'expected_close_date' ||
                          column.key === 'won_date'
                        ) {
                          return (
                            <td key={column.key} className={cellClassName}>
                              {formatDate(deal[column.key])}
                            </td>
                          );
                        }
                        if (column.key === 'next_action_date') {
                          const formatted = formatDate(deal[column.key]);
                          const dday = getDdayText(deal[column.key]);
                          const urgent =
                            (dday.startsWith('D-') && Number(dday.slice(2)) <= 5) || dday.startsWith('D+');
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
                        if (column.key === 'status') {
                          const statusKey = deal.status === '수주' ? 'complete' : deal.status === '실주' ? 'lost' : 'progress';
                          return (
                            <td key={column.key} className={cellClassName}>
                              <span className={`deal-status-badge deal-status-badge--${statusKey}`}>
                                {deal.status}
                              </span>
                            </td>
                          );
                        }
                        return (
                          <td key={column.key} className={cellClassName}>
                            {deal[column.key] ?? ''}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {status === 'ready' && filteredDeals.length > 0 && (
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
          <div
            className={`modal__content modal__content--white deal-modal__content ${modalSizeClass}`}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal__header">
              <div className="modal__title-row modal__title-row--spaced">
                <h3>{editingId ? '딜 수정' : '딜 등록'}</h3>
                <button className="icon-button" type="button" onClick={closeModal} aria-label="닫기">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6.4 5l12.6 12.6-1.4 1.4L5 6.4 6.4 5z" />
                    <path d="M19 6.4 6.4 19l-1.4-1.4L17.6 5 19 6.4z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className={`modal__body deal-modal__body ${modalLayoutClass}`}>
              {showLeadPanel && (
                <div className="deal-modal__lead">
                  {dealLeadInfo ? (
                    <div className="deal-modal__lead-form">
                      {leadModalLeftFields.map((field) => {
                        const rawValue =
                          field.name === 'lead_code'
                            ? formData.lead_code || formData.lead_id || dealLeadInfo.lead_code || dealLeadInfo.id
                            : dealLeadInfo[field.name];
                        return (
                          <label className="project-form__field" key={field.name}>
                            <input
                              type="text"
                              placeholder=" "
                              value={rawValue ?? ''}
                              data-filled={rawValue ? 'true' : 'false'}
                              readOnly
                            />
                            <span>{field.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="table__status">리드 정보를 찾을 수 없습니다.</p>
                  )}
                </div>
              )}
              <form className="project-form deal-modal__form" onSubmit={handleSubmit}>
                {dealFields.map((field) => {
                  const stageValue = formData.stage || '';
                  if (showLeadPanel && field.name === 'lead_id') {
                    return null;
                  }
                  if (editingId && stageValue === '실주') {
                    if (
                      ['expected_amount', 'expected_close_date', 'won_date', 'next_action_date', 'next_action_content'].includes(
                        field.name
                      )
                    ) {
                      return null;
                    }
                  }
                  if (editingId && stageValue && stageValue !== '실주' && field.name === 'loss_reason') {
                    return null;
                  }
                  return (
                    <label
                      className={`project-form__field${field.type === 'select' ? ' project-form__field--has-clear' : ''}`}
                      htmlFor={`deal-${field.name}`}
                      key={field.name}
                    >
                      {field.type === 'textarea' ? (
                        <textarea
                          id={`deal-${field.name}`}
                          name={field.name}
                          rows="4"
                          placeholder=" "
                          value={formData[field.name] ?? ''}
                          onChange={(event) => handleChange(field.name, event.target.value)}
                        />
                      ) : field.type === 'select' ? (
                        <>
                          {field.name === 'lead_id' && editingId ? (
                            <input
                              id={`deal-${field.name}`}
                              name={field.name}
                              type="text"
                              placeholder=" "
                              value={formData.lead_code || formData.lead_id || ''}
                              data-filled={formData.lead_code || formData.lead_id ? 'true' : 'false'}
                              readOnly
                            />
                          ) : (
                            <>
                              <select
                                id={`deal-${field.name}`}
                                name={field.name}
                                value={formData[field.name] ?? ''}
                                data-filled={formData[field.name] ? 'true' : 'false'}
                                onChange={(event) => handleChange(field.name, event.target.value)}
                              >
                                <option value="" hidden />
                                {field.name === 'lead_id'
                                  ? leads.map((lead) => (
                                      <option key={lead.id} value={lead.id}>
                                        {lead.lead_code || lead.id} - {lead.company}
                                      </option>
                                    ))
                                  : (() => {
                                      if (field.name !== 'stage') {
                                        return field.options?.map((option) => (
                                          <option key={option} value={option}>
                                            {option}
                                          </option>
                                        ));
                                      }
                                      const currentValue = formData[field.name] ?? '';
                                      const mergedOptions = Array.from(
                                        new Set([currentValue, ...(field.options || [])])
                                      ).filter(Boolean);
                                      return mergedOptions.map((option) => (
                                        <option key={option} value={option}>
                                          {option}
                                        </option>
                                      ));
                                    })()}
                              </select>
                              {formData[field.name] && (
                                <button
                                  className="select-clear"
                                  type="button"
                                  aria-label={`${field.label} 초기화`}
                                  onClick={() => handleChange(field.name, '')}
                                >
                                  ×
                                </button>
                              )}
                            </>
                          )}
                        </>
                      ) : (
                        <input
                          id={`deal-${field.name}`}
                          name={field.name}
                          type={field.name === 'expected_amount' ? 'text' : field.type}
                          inputMode={field.name === 'expected_amount' ? 'numeric' : undefined}
                          placeholder=" "
                          value={formData[field.name] ?? ''}
                          data-filled={field.type === 'date' ? (formData[field.name] ? 'true' : 'false') : undefined}
                          onChange={(event) => {
                            if (field.type === 'date') {
                              event.target.dataset.filled = event.target.value ? 'true' : 'false';
                              handleChange(field.name, event.target.value);
                              return;
                            }
                            if (field.name === 'expected_amount') {
                              const raw = event.target.value.replace(/[^\d]/g, '');
                              const formatted = raw ? Number(raw).toLocaleString('ko-KR') : '';
                              handleChange(field.name, formatted);
                              return;
                            }
                            handleChange(field.name, event.target.value);
                          }}
                        />
                      )}
                      <span>{field.label}</span>
                    </label>
                  );
                })}
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
                {errorMessage && null}
              </form>
              {showLogPanel && (
                <div className="deal-modal__logs">
                  <div className="deal-modal__logs-header">
                    <h4 className="deal-modal__logs-title">활동기록</h4>
                    <span className="help-badge" aria-label="도움말">
                      ?
                      <span className="help-badge__tooltip">최신 항목은 위에서부터 표시됩니다.</span>
                    </span>
                  </div>
                  {dealLogs.length === 0 ? (
                    <p className="table__status">기록이 없습니다.</p>
                  ) : (
                    <div className="deal-modal__logs-list">
                      {dealLogs.map((log) => (
                        <div className="deal-modal__log-item" key={log.id}>
                          <div className="deal-modal__log-header">
                            <span className="deal-modal__log-date">{formatDate(log.activity_date)}</span>
                          </div>
                          <div className="deal-modal__log-row">
                            <span className="deal-modal__log-label">담당자</span>
                            <span className="deal-modal__log-value">{log.manager || '-'}</span>
                          </div>
                          <div className="deal-modal__log-row">
                            <span className="deal-modal__log-label">다음액션일</span>
                            <span className="deal-modal__log-value">{formatDate(log.next_action_date) || '-'}</span>
                          </div>
                          <div className="deal-modal__log-row">
                            <span className="deal-modal__log-label">다음액션내용</span>
                            <span className="deal-modal__log-value">{log.next_action_content || '-'}</span>
                          </div>
                          <div className="deal-modal__log-row">
                            <span className="deal-modal__log-label">담당자(영업)</span>
                            <span className="deal-modal__log-value">{log.sales_owner || '-'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirmState.open}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm || handleConfirmCancel}
        onCancel={handleConfirmCancel}
      />
      {toastMessage && <div className={`toast toast--${toastType}`}>{toastMessage}</div>}
      {isLeadModalOpen && (
        <div className="modal">
          <div className="modal__overlay" onClick={closeLeadModal} />
          <div className="modal__content" role="dialog" aria-modal="true">
            <div className="modal__header">
              <div className="modal__title-row modal__title-row--spaced">
                <h3>리드 정보</h3>
                <button className="icon-button" type="button" onClick={closeLeadModal} aria-label="닫기">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6.4 5l12.6 12.6-1.4 1.4L5 6.4 6.4 5z" />
                    <path d="M19 6.4 6.4 19l-1.4-1.4L17.6 5 19 6.4z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="modal__body">
              {selectedLead ? (
                <div className="lead-info">
                  <div className="lead-info__grid">
                    <div className="lead-info__column">
                      {leadCustomerFields.map((field) => (
                        <div className="lead-info__item" key={field.name}>
                          <span className="lead-info__label">{field.label}</span>
                          <span className="lead-info__value">{selectedLead[field.name] ?? '-'}</span>
                        </div>
                      ))}
                    </div>
                    <div className="lead-info__column">
                      {leadDetailFields.map((field) => {
                        const rawValue = selectedLead[field.name];
                        const displayValue =
                          field.type === 'date' ? formatDate(rawValue) : rawValue ?? '-';
                        return (
                          <div className="lead-info__item" key={field.name}>
                            <span className="lead-info__label">{field.label}</span>
                            <span className="lead-info__value">{displayValue || '-'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="table__status">리드 정보를 찾을 수 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DealsPage;
