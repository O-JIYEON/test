import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ConfirmDialog from '../../components/dialogs/ConfirmDialog';
import '../../components/dialogs/modal.css';
import {
  fetchDeals,
  createDeal,
  updateDeal,
  deleteDeal as deleteDealApi
} from '../../api/deals.api';
import { fetchLeads } from '../../api/leads.api';
import { fetchActivityLogs } from '../../api/activities.api';
import { fetchLookupValues } from '../../api/lookup.api';
import Pagination from '../../components/common/pagination';
import Toast from '../../components/feedback/Toast';
import Loading from '../../components/feedback/Loading';
import DealModal from './components/DealModal';
import LeadInfoModal from './components/LeadInfoModal';
import './deals.css';
import dayjs, {
  formatDate as formatDateValue,
  formatDateTime as formatDateTimeValue,
  normalizeDateForCompare,
  parseDateOnly
} from '../../utils/date';

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

const formatDate = (value) => formatDateValue(value);

const formatDateTime = (value) => {
  if (!value) {
    return '';
  }

  return formatDateTimeValue(value);
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
  const target = parseDateOnly(nextActionDate);
  if (!target) {
    return 0;
  }
  const normalizedToday = normalizeDateForCompare(dayjs());
  const diffDays = normalizedToday.diff(target, 'day');
  return diffDays > 0 ? diffDays : 0;
};

const getDdayText = (value) => {
  if (!value) {
    return '';
  }
  const target = parseDateOnly(value);
  if (!target) {
    return '';
  }
  const normalizedToday = normalizeDateForCompare(dayjs());
  const diffDays = Math.ceil(target.diff(normalizedToday, 'day', true));
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
      { name: 'won_date', label: '수주확정일', type: 'date' },
      { name: 'expected_amount', label: '예상금액(원)', type: 'number' },
      { name: 'expected_close_date', label: '예상수주일', type: 'date' },
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
      const data = await fetchDeals();
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
      const data = await fetchLeads();
      setLeads(data.leads || []);
    } catch (error) {
      console.error(error);
      showToast('리드 데이터를 불러오지 못했습니다.');
    }
  };

  const loadActivityLogs = async () => {
    try {
      const data = await fetchActivityLogs();
      setActivityLogs(data.logs || []);
    } catch (error) {
      console.error(error);
      showToast('활동 기록을 불러오지 못했습니다.');
    }
  };

  const loadLookupValues = async () => {
    try {
      const data = await fetchLookupValues();
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
      deal_code: '',
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
      deal_code: deal.deal_code ?? '',
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

  const applyLogToForm = (log) => {
    setFormData((prev) => ({
      ...prev,
      project_name: log.project_name ?? prev.project_name ?? '',
      stage: log.deal_stage ?? prev.stage ?? '',
      expected_amount:
        log.expected_amount !== null && log.expected_amount !== undefined && log.expected_amount !== ''
          ? Number(String(log.expected_amount).replace(/,/g, '')).toLocaleString('ko-KR')
          : prev.expected_amount ?? '',
      next_action_date: formatDate(log.next_action_date) || '',
      next_action_content: log.next_action_content ?? ''
    }));
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
      const data = editingId ? await updateDeal(editingId, payload) : await createDeal(payload);
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

  const deleteDealAction = async () => {
    try {
      await deleteDealApi(editingId);
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
        deleteDealAction();
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
          <div className="filter-row__actions" />
        </div>
        <div className="content__card content__card--wide">
          {status === 'loading' && <Loading />}
          {status === 'error' && null}
          {status === 'ready' && (
            <div className="table__wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    {dealColumns.map((column) => {
                      const headerClassName =
                        column.key === 'created_at' ||
                        column.key === 'owner' ||
                        ['loss_reason', 'inactive_days', 'expected_close_date', 'won_date'].includes(column.key)
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
                          column.key === 'created_at' ||
                          column.key === 'owner' ||
                          ['loss_reason', 'inactive_days', 'expected_close_date', 'won_date'].includes(column.key)
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
                        if (column.key === 'company' || column.key === 'stage' || column.key === 'customer_owner') {
                          return (
                            <td key={column.key} className={`${cellClassName} deal-table__nowrap`}>
                              {deal[column.key] ?? '-'}
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
                          column.key === 'created_at'
) {
                          return (
                            <td key={column.key} className={cellClassName}>
                              {formatDateTime(deal[column.key])}
                            </td>
                          );
                        }

                        if (
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
                          const showDday = deal.stage !== '수주' && deal.stage !== '실주';
                          return (
                            <td key={column.key} className={`${cellClassName} deal-table__date`}>
                              {formatted}
                              {showDday && dday && (
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
            <Pagination page={clampedPage} totalPages={totalPages} onChange={setPage} variant="icon" />
          )}
        </div>
      </section>
      <DealModal
        isOpen={isModalOpen}
        editingId={editingId}
        formData={formData}
        modalSizeClass={modalSizeClass}
        modalLayoutClass={modalLayoutClass}
        showLeadPanel={showLeadPanel}
        showLogPanel={showLogPanel}
        dealLeadInfo={dealLeadInfo}
        leadModalLeftFields={leadModalLeftFields}
        dealFields={dealFields}
        leads={leads}
        dealLogs={dealLogs}
        formStatus={formStatus}
        errorMessage={errorMessage}
        closeModal={closeModal}
        handleSubmit={handleSubmit}
        handleChange={handleChange}
        handleDelete={handleDelete}
        applyLogToForm={applyLogToForm}
        formatDate={formatDate}
        formatAmount={formatAmount}
      />
      <ConfirmDialog
        open={confirmState.open}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm || handleConfirmCancel}
        onCancel={handleConfirmCancel}
      />
      <Toast message={toastMessage} variant={toastType} />
      <LeadInfoModal
        isOpen={isLeadModalOpen}
        selectedLead={selectedLead}
        leadCustomerFields={leadCustomerFields}
        leadDetailFields={leadDetailFields}
        closeModal={closeLeadModal}
        formatDate={formatDate}
      />
    </>
  );
}

export default DealsPage;
