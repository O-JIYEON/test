import { useEffect, useMemo, useState } from 'react';
import ConfirmDialog from '../../components/dialogs/ConfirmDialog';
import '../../components/dialogs/modal.css';
import Pagination from '../../components/common/pagination';
import IconButton from '../../components/common/IconButton';
import Toast from '../../components/feedback/Toast';
import Loading from '../../components/feedback/Loading';
import LeadModal from './components/LeadModal';
import mailIcon from '../../assets/icon/mail.svg';
import './leads.css';
import { fetchActivityLogs } from '../../api/activities.api';
import {
  fetchLeads,
  createLead,
  updateLead,
  deleteLead as deleteLeadApi
} from '../../api/leads.api';
import { fetchCustomers, fetchCustomerContacts } from '../../api/customers.api';
import { fetchLookupValues } from '../../api/lookup.api';
import dayjs, {
  formatDate as formatDateValue,
  formatDateTime as formatDateTimeValue,
  normalizeDateForCompare,
  parseDateOnly
} from '../../utils/date';

const defaultLeadStatusOptions = ['신규', '접촉중', '딜전환', '폐기', '보류'];
const defaultSourceOptions = ['문의(웹/매일)', '소개', '전시/세미나', '재접촉', '콜드', '파트너'];
const defaultProductLineOptions = ['SI(프로젝트)', '유지보수', 'PoC/데모', '구독/라이센스', 'HW+SW'];
const defaultRegionOptions = ['수도권', '영남', '호남', '충청', '강원', '제주', '해외'];
const defaultSegmentOptions = ['Enterprise', 'SMB', '공공', '제조', '에너지', '조선/해양', '건설'];
const defaultOwnerOptions = ['미지정'];

const customerFields = [
  { name: 'business_registration_number', label: '사업자 등록증번호', type: 'text' }
];

const contactDetailFields = [
  { name: 'contact', label: '연락처', type: 'text' },
  { name: 'email', label: '이메일', type: 'text' }
];

const leadFieldConfig = [
  { name: 'customer_owner', label: '담당자(영업)', type: 'select', category: '담당자' },
  { name: 'source', label: '유입소스', type: 'select', category: '유입소스' },
  { name: 'product_line', label: '제품라인', type: 'select', category: '제품라인' },
  { name: 'region', label: '지역', type: 'select', category: '지역' },
  { name: 'segment', label: '세그먼트', type: 'select', category: '세그먼트' },
  {
    name: 'lead_status',
    label: '리드상태',
    type: 'select',
    category: '리드상태'
  },
  { name: 'content', label: '내용', type: 'textarea' },
  { name: 'next_action_date', label: '다음액션일', type: 'date' },
  { name: 'next_action_content', label: '다음액션내용', type: 'textarea' }
];

const leadColumns = [
  { key: 'id', label: 'LeadId' },
  { key: 'created_at', label: '유입일자' },
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

const formatDate = (value) => formatDateValue(value);

const formatDateTime = (value) => {
  if (!value) {
    return '';
  }

  return formatDateTimeValue(value);
};

const formatLeadId = (lead) => {
  if (lead.lead_code) {
    return lead.lead_code;
  }
  const raw = lead.created_at || '';
  const datePart = raw ? formatDate(raw).replace(/-/g, '') : '00000000';
  const seq = String(lead.id ?? 0).padStart(5, '0');
  return `${datePart}-L${seq}`;
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

function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerContacts, setCustomerContacts] = useState([]);
  const [lookupValues, setLookupValues] = useState([]);
  const [status, setStatus] = useState('loading');
  const [formData, setFormData] = useState({});
  const [customerForm, setCustomerForm] = useState({});
  const [contactForm, setContactForm] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [formStatus, setFormStatus] = useState('');
  const [formErrorMessage, setFormErrorMessage] = useState('');
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerListOpen, setCustomerListOpen] = useState(false);
  const [customerHighlightIndex, setCustomerHighlightIndex] = useState(-1);
  const [contactQuery, setContactQuery] = useState('');
  const [contactListOpen, setContactListOpen] = useState(false);
  const [contactHighlightIndex, setContactHighlightIndex] = useState(-1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [activityLogs, setActivityLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('전체');
  const [sortState, setSortState] = useState({ key: null, direction: null });
  const [confirmState, setConfirmState] = useState({
    open: false,
    message: '',
    onConfirm: null
  });
  const [selectedLogId, setSelectedLogId] = useState(null);
  const pageSize = 10;

  const customerMap = useMemo(() => {
    return customers.reduce((acc, customer) => {
      acc[customer.id] = customer;
      return acc;
    }, {});
  }, [customers]);

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

  const ownerOptions = lookupOptions['담당자']?.length
    ? lookupOptions['담당자']
    : defaultOwnerOptions;
  const sourceOptions = lookupOptions['유입소스']?.length ? lookupOptions['유입소스'] : defaultSourceOptions;
  const productLineOptions = lookupOptions['제품라인']?.length
    ? lookupOptions['제품라인']
    : defaultProductLineOptions;
  const regionOptions = lookupOptions['지역']?.length ? lookupOptions['지역'] : defaultRegionOptions;
  const segmentOptions = lookupOptions['세그먼트']?.length ? lookupOptions['세그먼트'] : defaultSegmentOptions;
  const leadStatusOptions = lookupOptions['리드상태']?.length
    ? lookupOptions['리드상태']
    : defaultLeadStatusOptions;

  const leadFields = useMemo(() => {
    return leadFieldConfig.map((field) => {
      if (field.type !== 'select') {
        return field;
      }
      if (field.category === '담당자') {
        return { ...field, options: ownerOptions };
      }
      if (field.category === '유입소스') {
        return { ...field, options: sourceOptions };
      }
      if (field.category === '제품라인') {
        return { ...field, options: productLineOptions };
      }
      if (field.category === '지역') {
        return { ...field, options: regionOptions };
      }
      if (field.category === '세그먼트') {
        return { ...field, options: segmentOptions };
      }
      if (field.category === '리드상태') {
        return { ...field, options: leadStatusOptions };
      }
      return field;
    });
  }, [ownerOptions, sourceOptions, productLineOptions, regionOptions, segmentOptions, leadStatusOptions]);

  const loadLeads = async () => {
    try {
      setStatus('loading');
      const data = await fetchLeads();
      setLeads(data.leads || []);
      setStatus('ready');
      setPage(1);
    } catch (error) {
      console.error(error);
      setStatus('error');
      showToast('데이터를 불러오지 못했습니다.');
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await fetchCustomers();
      setCustomers(data.customers || []);
    } catch (error) {
      console.error(error);
      showToast('고객사 데이터를 불러오지 못했습니다.');
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

  const loadActivityLogs = async () => {
    try {
      const data = await fetchActivityLogs();
      setActivityLogs(data.logs || []);
    } catch (error) {
      console.error(error);
    }
  };

  const loadCustomerContacts = async (customerId) => {
    if (!customerId) {
      setCustomerContacts([]);
      return;
    }
    try {
      const data = await fetchCustomerContacts(customerId);
      setCustomerContacts(data.contacts || []);
    } catch (error) {
      console.error(error);
      setCustomerContacts([]);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchAll() {
      try {
        await Promise.all([loadLeads(), loadCustomers(), loadLookupValues()]);
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

  useEffect(() => {
    if (isModalOpen && formData.customer_id) {
      loadCustomerContacts(formData.customer_id);
    } else {
      setCustomerContacts([]);
    }
  }, [formData.customer_id, isModalOpen]);

  const openCreateModal = () => {
    const defaultProjectId = '';
    setEditingId(null);
    setCustomerQuery('');
    setCustomerListOpen(false);
    setCustomerHighlightIndex(-1);
    setContactQuery('');
    setContactListOpen(false);
    setContactHighlightIndex(-1);
    setFormData({
      customer_id: defaultProjectId,
      contact_id: '',
      lead_code: '',
      customer_owner: '',
      source: sourceOptions[0] || '',
      product_line: productLineOptions[0] || '',
      region: regionOptions[0] || '',
      segment: segmentOptions[0] || '',
      content: '',
      lead_status: leadStatusOptions[0] || '',
      next_action_date: '',
      next_action_content: ''
    });
    setCustomerForm({
      business_registration_number: ''
    });
    setContactForm({
      name: '',
      contact: '',
      email: ''
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
    setContactQuery(lead.owner || '');
    setContactListOpen(false);
    setContactHighlightIndex(-1);
    setFormData({
      customer_id: lead.customer_id || '',
      contact_id: lead.contact_id || '',
      lead_code: lead.lead_code || '',
      customer_owner: lead.customer_owner || '',
      source: lead.source || sourceOptions[0] || '',
      product_line: lead.product_line || productLineOptions[0] || '',
      region: lead.region || regionOptions[0] || '',
      segment: lead.segment || segmentOptions[0] || '',
      content: lead.content || '',
      lead_status: lead.lead_status || leadStatusOptions[0] || '',
      next_action_date: formatDate(lead.next_action_date),
      next_action_content: lead.next_action_content || ''
    });
    setCustomerForm({
      business_registration_number: customer?.business_registration_number || ''
    });
    setContactForm({
      name: lead.owner || '',
      contact: lead.contact || '',
      email: lead.email || ''
    });
    setFormStatus('');
    setFormErrorMessage('');
    setIsModalOpen(true);
    setSelectedLogId(null);
    loadActivityLogs();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedLogId(null);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const applyLogToForm = (log) => {
    if (!log) {
      return;
    }
    setSelectedLogId(log.id ?? null);
    setFormData((prev) => ({
      ...prev,
      customer_owner: log.sales_owner ?? prev.customer_owner ?? '',
      next_action_date: formatDate(log.next_action_date) || '',
      next_action_content: log.next_action_content ?? ''
    }));
  };

  const leadLogs = useMemo(() => {
    if (!editingId) {
      return [];
    }
    return activityLogs
      .filter((log) => String(log.lead_id) === String(editingId))
      .slice()
      .sort((a, b) => {
        const aTime = a.activity_date ? new Date(a.activity_date).getTime() : 0;
        const bTime = b.activity_date ? new Date(b.activity_date).getTime() : 0;
        if (aTime !== bTime) {
          return aTime - bTime;
        }
        const aId = Number(a.id) || 0;
        const bId = Number(b.id) || 0;
        return aId - bId;
      });
  }, [activityLogs, editingId]);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }
    if (!leadLogs.length) {
      return;
    }
    if (selectedLogId) {
      return;
    }
    setSelectedLogId(leadLogs[leadLogs.length - 1]?.id ?? null);
  }, [isModalOpen, leadLogs, selectedLogId]);

  const showToast = (message, type = 'success') => {
    setToastType(type);
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
    setFormData((prev) => ({
      ...prev,
      customer_id: '',
      contact_id: ''
    }));
    setCustomerForm({
      business_registration_number: ''
    });
    setContactQuery('');
    setContactListOpen(false);
    setContactHighlightIndex(-1);
    setContactForm({
      name: '',
      contact: '',
      email: ''
    });
    setCustomerContacts([]);
  };

  const handleCustomerSelect = (customer) => {
    setCustomerQuery(customer.company || '');
    setCustomerListOpen(false);
    setCustomerHighlightIndex(-1);
    setFormData((prev) => ({
      ...prev,
      customer_id: customer.id,
      contact_id: ''
    }));
    setCustomerForm({
      business_registration_number: customer.business_registration_number || ''
    });
    setContactQuery('');
    setContactListOpen(false);
    setContactHighlightIndex(-1);
    setContactForm({
      name: '',
      contact: '',
      email: ''
    });
    loadCustomerContacts(customer.id);
  };

  const handleContactInput = (value) => {
    setContactQuery(value);
    setContactListOpen(true);
    setContactHighlightIndex(-1);
    setFormData((prev) => ({
      ...prev,
      contact_id: ''
    }));
    setContactForm({
      name: '',
      contact: '',
      email: ''
    });
  };

  const handleContactSelect = (contact) => {
    setContactQuery(contact.name || '');
    setContactListOpen(false);
    setContactHighlightIndex(-1);
    setFormData((prev) => ({
      ...prev,
      contact_id: contact.id
    }));
    setContactForm({
      name: contact.name || '',
      contact: contact.contact || '',
      email: contact.email || ''
    });
  };

  const filteredCustomers = useMemo(() => {
    const query = customerQuery.trim().toLowerCase();
    if (!query) {
      return customers;
    }
    return customers.filter((customer) => String(customer.company || '').toLowerCase().includes(query));
  }, [customers, customerQuery]);

  const filteredContacts = useMemo(() => {
    const query = contactQuery.trim().toLowerCase();
    if (!query) {
      return customerContacts;
    }
    return customerContacts.filter((contact) =>
      String(contact.name || '').toLowerCase().includes(query)
    );
  }, [customerContacts, contactQuery]);

  const submitLead = async () => {
    setFormStatus('saving');
    try {
      const customerId = formData.customer_id;
      if (!customerId) {
        setFormStatus('error');
        setFormErrorMessage('고객사를 선택해 주세요.');
        return;
      }

      const leadPayload = { ...formData, customer_id: customerId };
      const data = editingId
        ? await updateLead(editingId, leadPayload)
        : await createLead(leadPayload);
      await loadLeads();
      setIsModalOpen(false);
      setEditingId(null);
      setSelectedLogId(null);
      setFormData({});
      setCustomerForm({});
      setFormStatus('');
      setFormErrorMessage('');
      if (editingId) {
        showToast(data.dealCreated ? '딜이 생성되었습니다.' : '리드가 수정되었습니다.', 'success');
      } else {
        showToast(data.dealCreated ? '딜이 추가되었습니다.' : '리드가 등록되었습니다.', 'success');
      }
    } catch (error) {
      console.error(error);
      setFormStatus('error');
      setFormErrorMessage('저장에 실패했습니다.');
      showToast('저장에 실패했습니다.', 'error');
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

  const handleDeleteLead = async () => {
    try {
      await deleteLeadApi(editingId);
      await loadLeads();
      setIsModalOpen(false);
      setEditingId(null);
      setSelectedLogId(null);
      setFormData({});
      setFormStatus('');
      setFormErrorMessage('');
      showToast('리드가 삭제되었습니다.', 'success');
    } catch (error) {
      console.error(error);
      showToast('삭제에 실패했습니다.', 'error');
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
        handleDeleteLead();
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
      const matchesStatus = statusFilter === '전체' || statusFilter === '' || lead.lead_status === statusFilter;
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
          <h2>리드</h2>
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
        <div className="filter-row">
            <form className="project-form filter-form" onSubmit={(event) => event.preventDefault()}>
              <div className="filter-form__fields">
              <label className="project-form__field project-form__field--has-clear" htmlFor="lead-status-filter">
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
                {statusFilter && statusFilter !== '전체' && (
                  <button
                    className="select-clear"
                    type="button"
                    aria-label="리드상태 초기화"
                    onClick={() => {
                      setStatusFilter('');
                      setPage(1);
                    }}
                  >
                    ×
                  </button>
                )}
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
                등록
              </button>
            </div>
        </div>
      </section>
      <section className="content__section content__section--single">
        <div className="content__card content__card--wide">
          {status === 'loading' && <Loading />}
          {status === 'error' && null}
          {status === 'ready' && (
            <div className="table__wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    {leadColumns.map((column) => (
                      <th
                        key={column.key}
                        className={
                          [
                            'owner',
                            'contact',
                            'email'
                          ].includes(column.key)
                            ? 'lead-table__optional'
                            : ['created_at', 'source', 'product_line', 'segment'].includes(column.key)
                              ? 'lead-table__wide'
                              : ''
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
                  {sortedLeads.length === 0 && (
                    <tr className="data-table__row data-table__row--empty">
                      <td colSpan={leadColumns.length} className="data-table__empty">
                        {leads.length === 0 ? '데이터가 없습니다.' : '조건에 맞는 데이터가 없습니다.'}
                      </td>
                    </tr>
                  )}
                  {sortedLeads.length > 0 &&
                    visibleLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className={`data-table__row${lead.lead_status === '폐기' ? ' data-table__row--disabled' : ''}`}
                      onClick={() => openEditModal(lead)}
                    >
                      {leadColumns.map((column) => {
                        const cellClassName = ['owner', 'contact', 'email'].includes(column.key)
                          ? 'lead-table__optional'
                          : ['created_at', 'source', 'product_line', 'segment'].includes(column.key)
                            ? 'lead-table__wide'
                            : '';
                        if (column.key === 'id') {
                          return (
                            <td key={column.key} className={cellClassName}>
                              {formatLeadId(lead)}
                            </td>
                          );
                        }
                        if (column.key === 'created_at') {
                          return (
                            <td key={column.key} className={cellClassName}>
                              {formatDateTime(lead.created_at)}
                            </td>
                          );
                        }
                        if (column.key === 'next_action_date') {
                          const formatted = formatDate(lead[column.key]);
                          const status = lead.lead_status;
                          const dday =
                            status === '신규' || status === '접촉중' ? getDdayText(lead[column.key]) : '';
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
                                  <IconButton
                                    aria-label="이메일 복사"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      navigator.clipboard?.writeText(email);
                                      showToast('이메일이 복사되었습니다.', 'success');
                                    }}
                                  >
                                    <img src={mailIcon} alt="" aria-hidden="true" />
                                  </IconButton>
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
          {status === 'ready' && sortedLeads.length > 0 && (
            <Pagination page={clampedPage} totalPages={totalPages} onChange={setPage} variant="icon" />
          )}
        </div>
      </section>
      <LeadModal
        isOpen={isModalOpen}
        editingId={editingId}
        formData={formData}
        customerQuery={customerQuery}
        contactQuery={contactQuery}
        customerListOpen={customerListOpen}
        contactListOpen={contactListOpen}
        filteredCustomers={filteredCustomers}
        filteredContacts={filteredContacts}
        customerHighlightIndex={customerHighlightIndex}
        contactHighlightIndex={contactHighlightIndex}
        customerForm={customerForm}
        contactForm={contactForm}
        customerFields={customerFields}
        contactDetailFields={contactDetailFields}
        leadFields={leadFields}
        leadLogs={leadLogs}
        selectedLogId={selectedLogId}
        formStatus={formStatus}
        formatDate={formatDate}
        formatDateTime={formatDateTime}
        handleSubmit={handleSubmit}
        closeModal={closeModal}
        setCustomerListOpen={setCustomerListOpen}
        setCustomerHighlightIndex={setCustomerHighlightIndex}
        setContactListOpen={setContactListOpen}
        setContactHighlightIndex={setContactHighlightIndex}
        handleCustomerInput={handleCustomerInput}
        handleCustomerSelect={handleCustomerSelect}
        handleContactInput={handleContactInput}
        handleContactSelect={handleContactSelect}
        handleChange={handleChange}
        applyLogToForm={applyLogToForm}
        handleDelete={handleDelete}
      />
      <ConfirmDialog
        open={confirmState.open}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm || handleConfirmCancel}
        onCancel={handleConfirmCancel}
      />
      <Toast message={toastMessage} variant={toastType} />
    </>
  );
}

export default LeadsPage;
