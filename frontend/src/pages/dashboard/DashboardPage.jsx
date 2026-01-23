import ReactApexChart from 'react-apexcharts';
import { useEffect, useMemo, useState } from 'react';
import ConfirmDialog from '../../components/ConfirmDialog';

function DashboardPage() {
  const [deals, setDeals] = useState([]);
  const [lookupValues, setLookupValues] = useState([]);
  const [leads, setLeads] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [status, setStatus] = useState('loading');
  const [editingDeal, setEditingDeal] = useState(null);
  const [formData, setFormData] = useState({});
  const [formStatus, setFormStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });
  const [periodMode, setPeriodMode] = useState('year');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  const probabilityByStage = useMemo(() => {
    const map = lookupValues.reduce((acc, value) => {
      if (
        value.category_label !== '파이프라인 단계' &&
        value.category_label !== '딜단계'
      ) {
        return acc;
      }
      if (!value.label) {
        return acc;
      }
      const numericProbability = Number(value.probability);
      if (!Number.isNaN(numericProbability)) {
        acc[value.label] = numericProbability;
      }
      return acc;
    }, {});
    if (Object.keys(map).length) {
      return map;
    }
    return {
      '자격확인(가능성판단)': 10,
      '요구사항/기술검토': 25,
      '제안/견적': 50,
      '협상/계약': 75,
      수주: 100,
      실주: 0
    };
  }, [lookupValues]);

  const stageOptions = useMemo(() => {
    const stages = lookupValues
      .filter((value) => value.category_label === '파이프라인 단계')
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((value) => value.label)
      .filter(Boolean);
    return stages.length
      ? stages
      : ['자격확인(가능성판단)', '요구사항/기술검토', '제안/견적', '협상/계약', '수주', '실주'];
  }, [lookupValues]);

  const lossReasonOptions = ['가격', '경쟁사', '일정', '기술부적합', '예산 없음', '내부우선순위 변경', '기타'];

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

  const leadModalFields = [
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

  const parseAmount = (value) => {
    if (value === null || value === undefined) {
      return 0;
    }
    const numeric = Number(String(value).replace(/[^\d]/g, ''));
    return Number.isNaN(numeric) ? 0 : numeric;
  };

  const formatAmount = (value) => {
    if (!value) {
      return '0원';
    }
    return `${Number(value).toLocaleString('ko-KR')}원`;
  };

  const formatDate = (value) => {
    if (!value) {
      return '';
    }
    const text = String(value);
    if (/^\\d{4}-\\d{2}-\\d{2}$/.test(text)) {
      return text;
    }
    if (text.includes('T') || text.includes(' ')) {
      return text.slice(0, 10);
    }
    return text.length >= 10 ? text.slice(0, 10) : text;
  };

  const getStatus = (deal) => {
    if (deal.status) {
      return deal.status;
    }
    if (deal.stage === '수주') {
      return '수주';
    }
    if (deal.stage === '실주') {
      return '실주';
    }
    return '진행';
  };

  const getMonthLabel = (dateValue) => {
    if (!dateValue) {
      return null;
    }
    const text = String(dateValue).slice(0, 10);
    const [year, month] = text.split('-');
    if (!year || !month) {
      return null;
    }
    return `${year}-${month}`;
  };

  const getYearLabel = (dateValue) => {
    if (!dateValue) {
      return null;
    }
    const text = String(dateValue).slice(0, 10);
    const [year] = text.split('-');
    return year || null;
  };

  useEffect(() => {
    const loadDeals = async () => {
      try {
        setStatus('loading');
        const response = await fetch(`http://${window.location.hostname}:5001/api/deals`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch deals');
        }
        setDeals(data.deals || []);
        setStatus('ready');
      } catch (error) {
        console.error(error);
        setStatus('error');
      }
    };
    loadDeals();
    const loadLeads = async () => {
      try {
        const response = await fetch(`http://${window.location.hostname}:5001/api/leads`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch leads');
        }
        setLeads(data.leads || []);
      } catch (error) {
        console.error(error);
      }
    };
    const loadActivityLogs = async () => {
      try {
        const response = await fetch(`http://${window.location.hostname}:5001/api/activity-logs`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch activity logs');
        }
        setActivityLogs(data.logs || []);
      } catch (error) {
        console.error(error);
      }
    };
    const loadLookupValues = async () => {
      try {
        const response = await fetch(`http://${window.location.hostname}:5001/api/lookup-values`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch lookup values');
        }
        setLookupValues(data.values || []);
      } catch (error) {
        console.error(error);
      }
    };
    loadLookupValues();
    loadLeads();
    loadActivityLogs();
  }, []);

  const availableYears = useMemo(() => {
    const years = new Set();
    deals.forEach((deal) => {
      const baseDate = deal.expected_close_date || deal.created_at;
      const year = getYearLabel(baseDate);
      if (year) {
        years.add(year);
      }
    });
    return Array.from(years).sort();
  }, [deals]);

  const availableMonths = useMemo(() => {
    const months = new Set();
    deals.forEach((deal) => {
      const baseDate = deal.expected_close_date || deal.created_at;
      const month = getMonthLabel(baseDate);
      if (month) {
        months.add(month);
      }
    });
    return Array.from(months).sort();
  }, [deals]);

  useEffect(() => {
    if (!selectedYear && availableYears.length) {
      setSelectedYear(availableYears[availableYears.length - 1]);
    }
  }, [availableYears, selectedYear]);

  useEffect(() => {
    if (!selectedMonth && availableMonths.length) {
      setSelectedMonth(availableMonths[availableMonths.length - 1]);
    }
  }, [availableMonths, selectedMonth]);

  const filteredDeals = useMemo(() => {
    if (!deals.length) {
      return [];
    }
    if (periodMode === 'year' && selectedYear) {
      return deals.filter((deal) => getYearLabel(deal.expected_close_date || deal.created_at) === selectedYear);
    }
    if (periodMode === 'month' && selectedMonth) {
      return deals.filter((deal) => getMonthLabel(deal.expected_close_date || deal.created_at) === selectedMonth);
    }
    return deals;
  }, [deals, periodMode, selectedYear, selectedMonth]);

  const monthlyData = useMemo(() => {
    const buckets = {};
    filteredDeals.forEach((deal) => {
      if (getStatus(deal) !== '수주') {
        return;
      }
      const month = getMonthLabel(deal.won_date);
      if (!month) {
        return;
      }
      if (!buckets[month]) {
        buckets[month] = { month, actual: 0 };
      }
      buckets[month].actual += parseAmount(deal.expected_amount);
    });
    const entries = Object.values(buckets).sort((a, b) => (a.month > b.month ? 1 : -1));
    const fallback = [
      { month: '2026-01', actual: 120000000 },
      { month: '2026-02', actual: 90000000 },
      { month: '2026-03', actual: 140000000 },
      { month: '2026-04', actual: 110000000 },
      { month: '2026-05', actual: 160000000 }
    ];
    const source = entries.length ? entries : fallback;
    return source.map((item) => ({
      month: item.month,
      actual: item.actual,
      goal: Math.round(item.actual * 0.9)
    }));
  }, [filteredDeals]);

  const monthlySeries = [
    { name: '목표', data: monthlyData.map((item) => item.goal) },
    { name: '실적달성액', data: monthlyData.map((item) => item.actual) }
  ];

  const chartGapColor =
    typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light'
      ? '#f8fafc'
      : '#0a0f1e';

  const monthlyOptions = {
    chart: {
      type: 'bar',
      stacked: false,
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        columnWidth: '30px',
        borderRadius: 6,
        barGap: '2px'
      }
    },
    stroke: {
      width: 2,
      colors: [chartGapColor]
    },
    colors: ['#155e75', '#1f6f8a'],
    dataLabels: { enabled: false },
    xaxis: {
      categories: monthlyData.map((item) => item.month),
      labels: { style: { colors: '#94a3b8' } }
    },
    yaxis: {
      labels: {
        style: { colors: '#94a3b8' },
        formatter: (value) => `${(value / 100000000).toFixed(1)}억`
      }
    },
    grid: { borderColor: 'rgba(148, 163, 184, 0.15)' },
    tooltip: {
      y: {
        formatter: (value) => `${Number(value).toLocaleString('ko-KR')}원`
      }
    },
    legend: { show: false }
  };

  const overviewStats = useMemo(() => {
    const won = filteredDeals.reduce((sum, deal) => {
      if (getStatus(deal) !== '수주') {
        return sum;
      }
      return sum + parseAmount(deal.expected_amount);
    }, 0);
    return [{ label: '총 수주액', value: formatAmount(won) }];
  }, [filteredDeals]);

  const recentActiveDeals = useMemo(() => {
    return filteredDeals
      .filter((deal) => {
        const statusValue = getStatus(deal);
        return statusValue !== '수주' && statusValue !== '실주' && statusValue !== '폐기';
      })
      .sort((a, b) => {
        const aTime = new Date(a.created_at || a.updated_at || 0).getTime();
        const bTime = new Date(b.created_at || b.updated_at || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 5);
  }, [filteredDeals]);

  const leadMap = useMemo(() => {
    return leads.reduce((acc, lead) => {
      acc[lead.id] = lead;
      return acc;
    }, {});
  }, [leads]);

  const dealLeadInfo = useMemo(() => {
    if (!editingDeal?.lead_id) {
      return null;
    }
    return leadMap[editingDeal.lead_id] || null;
  }, [editingDeal, leadMap]);

  const dealLogs = useMemo(() => {
    if (!editingDeal?.id) {
      return [];
    }
    return activityLogs.filter((log) => String(log.deal_id) === String(editingDeal.id));
  }, [activityLogs, editingDeal]);

  const showLeadPanel = Boolean(editingDeal && dealLeadInfo);
  const showLogPanel = Boolean(editingDeal);
  const modalLayoutClass = showLeadPanel
    ? 'deal-modal__body--triple'
    : showLogPanel
      ? 'deal-modal__body--double'
      : 'deal-modal__body--single';
  const modalSizeClass = showLeadPanel ? 'deal-modal__content--wide' : '';

  const openEditModal = (deal) => {
    setEditingDeal(deal);
    setFormData({
      lead_id: deal.lead_id ?? '',
      lead_code: deal.lead_code ?? '',
      project_name: deal.project_name || '',
      stage: deal.stage || '',
      expected_amount: formatAmount(deal.expected_amount) || '',
      expected_close_date: formatDate(deal.expected_close_date),
      won_date: formatDate(deal.won_date),
      next_action_date: formatDate(deal.next_action_date),
      next_action_content: deal.next_action_content || '',
      loss_reason: deal.loss_reason || ''
    });
    setFormStatus('');
    setErrorMessage('');
    setIsDealModalOpen(true);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const submitDeal = async () => {
    if (!editingDeal) {
      return;
    }
    setFormStatus('saving');
    try {
      const payload = {
        ...formData,
        expected_amount:
          formData.expected_amount !== undefined && formData.expected_amount !== null
            ? String(formData.expected_amount).replace(/,/g, '')
            : formData.expected_amount
      };
      const response = await fetch(`http://${window.location.hostname}:5001/api/deals/${editingDeal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update deal');
      }
      const refreshed = await fetch(`http://${window.location.hostname}:5001/api/deals`);
      const refreshedData = await refreshed.json();
      if (refreshed.ok) {
        setDeals(refreshedData.deals || []);
      }
      setFormStatus('');
      setIsDealModalOpen(false);
      setEditingDeal(null);
    } catch (error) {
      console.error(error);
      setFormStatus('');
      setErrorMessage('저장에 실패했습니다.');
    }
  };

  const deleteDeal = async () => {
    if (!editingDeal) {
      return;
    }
    try {
      const response = await fetch(`http://${window.location.hostname}:5001/api/deals/${editingDeal.id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete deal');
      }
      const refreshed = await fetch(`http://${window.location.hostname}:5001/api/deals`);
      const refreshedData = await refreshed.json();
      if (refreshed.ok) {
        setDeals(refreshedData.deals || []);
      }
      setIsDealModalOpen(false);
      setEditingDeal(null);
      setFormStatus('');
      setErrorMessage('');
    } catch (error) {
      console.error(error);
      setErrorMessage('삭제에 실패했습니다.');
    }
  };

  const handleDelete = () => {
    if (!editingDeal) {
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

  const pipelineStages = stageOptions;

  const pipelineSeries = useMemo(() => {
    const sums = filteredDeals.reduce((acc, deal) => {
      const amount = parseAmount(deal.expected_amount);
      const stage = deal.stage || '미지정';
      acc[stage] = (acc[stage] || 0) + amount;
      return acc;
    }, {});
    return [
      {
        name: '금액 합계',
        data: pipelineStages.map((stage) => sums[stage] || 0)
      }
    ];
  }, [filteredDeals, pipelineStages]);

  const pipelineOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      width: '100%'
    },
    colors: ['#2563eb', '#16a34a', '#ef4444', '#f59e0b', '#7c3aed', '#14b8a6'],
    stroke: { colors: ['transparent'] },
    dataLabels: { enabled: false },
    legend: {
      show: false
    },
    plotOptions: {
      bar: {
        horizontal: true,
        isFunnel: true,
        borderRadius: 4,
        distributed: true
      }
    },
    xaxis: {
      categories: pipelineStages,
      labels: {
        formatter: (value) => `${(value / 100000000).toFixed(1)}억`,
        style: { colors: '#94a3b8' }
      }
    },
    yaxis: {
      labels: { style: { colors: '#94a3b8' } }
    },
    tooltip: {
      y: {
        formatter: (value) => `${Number(value).toLocaleString('ko-KR')}원`
      }
    }
  };

  return (
    <>
      <section className="content__section content__section--single">
        <div className="dashboard">
          <div className="dashboard__period">
            <div className="dashboard__period-toggle">
              <button
                type="button"
                className={`dashboard__period-btn${periodMode === 'year' ? ' dashboard__period-btn--active' : ''}`}
                onClick={() => setPeriodMode('year')}
              >
                연도별
              </button>
              <button
                type="button"
                className={`dashboard__period-btn${periodMode === 'month' ? ' dashboard__period-btn--active' : ''}`}
                onClick={() => setPeriodMode('month')}
              >
                월별
              </button>
            </div>
            <div className="dashboard__period-select">
              {periodMode === 'year' ? (
                <label className="project-form__field" htmlFor="dashboard-year-select">
                  <select
                    id="dashboard-year-select"
                    value={selectedYear}
                    onChange={(event) => setSelectedYear(event.target.value)}
                    data-filled={selectedYear ? 'true' : 'false'}
                  >
                    {availableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}년
                      </option>
                    ))}
                  </select>
                  <span>연도</span>
                </label>
              ) : (
                <label className="project-form__field" htmlFor="dashboard-month-select">
                  <select
                    id="dashboard-month-select"
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                    data-filled={selectedMonth ? 'true' : 'false'}
                  >
                    {availableMonths.map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                  <span>월</span>
                </label>
              )}
            </div>
          </div>

          <div className="dashboard__overview">
            <div className="dashboard__overview-cards">
              {overviewStats.map((item) => (
                <div className="dashboard__overview-card" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard__section">
            <div className="dashboard__section-title">monthly</div>
            <div className="dashboard__chart">
              <div className="dashboard__chart-canvas">
                <ReactApexChart options={monthlyOptions} series={monthlySeries} type="bar" height={240} />
              </div>
            </div>
          </div>

          <div className="dashboard__bottom">
            <div className="dashboard__section">
              <div className="dashboard__section-title">PipeLine Analysis</div>
              <div className="dashboard__pipeline">
                <div className="dashboard__pipeline-visual dashboard__pipeline-chart">
                  <ReactApexChart options={pipelineOptions} series={pipelineSeries} type="bar" height={200} />
                </div>
              </div>
            </div>
            <div className="dashboard__section">
              <div className="dashboard__section-title">진행중인 딜</div>
              <div className="dashboard__table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Deal ID</th>
                      <th>회사명</th>
                      <th>프로젝트/건명</th>
                      <th>예상금액(원)</th>
                      <th>확률</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActiveDeals.length === 0 && (
                      <tr className="data-table__row">
                        <td colSpan={5}>데이터가 없습니다.</td>
                      </tr>
                    )}
                    {recentActiveDeals.map((deal) => (
                      <tr
                        key={deal.id}
                        className="data-table__row"
                        onClick={() => {
                          openEditModal(deal);
                        }}
                      >
                        <td>{deal.deal_code || deal.id}</td>
                        <td>{deal.company || '-'}</td>
                        <td>{deal.project_name || '-'}</td>
                        <td>{formatAmount(parseAmount(deal.expected_amount))}</td>
                        <td>{deal.stage ? `${probabilityByStage[deal.stage] ?? 0}%` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>
      {isDealModalOpen && editingDeal && (
        <div className="modal">
          <div className="modal__overlay" onClick={() => setIsDealModalOpen(false)} />
          <div className={`modal__content modal__content--white deal-modal__content ${modalSizeClass}`} role="dialog" aria-modal="true">
            <div className="modal__header">
              <div className="modal__title-row modal__title-row--spaced">
                <h3>딜 수정</h3>
                <button className="icon-button" type="button" onClick={() => setIsDealModalOpen(false)} aria-label="닫기">
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
                  <div className="deal-modal__lead-form">
                    {leadModalFields.map((field) => {
                      const rawValue =
                        field.name === 'lead_code'
                          ? formData.lead_code || formData.lead_id || dealLeadInfo.lead_code || dealLeadInfo.id
                          : dealLeadInfo[field.name];
                      return (
                        <label className="project-form__field" key={field.name}>
                          <input type="text" placeholder=" " value={rawValue ?? ''} data-filled={rawValue ? 'true' : 'false'} readOnly />
                          <span>{field.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
              <form className="project-form deal-modal__form" onSubmit={(event) => {
                event.preventDefault();
                submitDeal();
              }}>
                {dealFields.map((field) => {
                  const stageValue = formData.stage || '';
                  if (showLeadPanel && field.name === 'lead_id') {
                    return null;
                  }
                  if (stageValue === '실주') {
                    if (
                      ['expected_amount', 'expected_close_date', 'won_date', 'next_action_date', 'next_action_content'].includes(
                        field.name
                      )
                    ) {
                      return null;
                    }
                  }
                  if (stageValue && stageValue !== '실주' && field.name === 'loss_reason') {
                    return null;
                  }
                  return (
                    <label
                      className={`project-form__field${field.type === 'select' ? ' project-form__field--has-clear' : ''}`}
                      htmlFor={`dashboard-deal-${field.name}`}
                      key={field.name}
                    >
                      {field.type === 'textarea' ? (
                        <textarea
                          id={`dashboard-deal-${field.name}`}
                          name={field.name}
                          rows="4"
                          placeholder=" "
                          value={formData[field.name] ?? ''}
                          onChange={(event) => handleChange(field.name, event.target.value)}
                        />
                      ) : field.type === 'select' ? (
                        <>
                          {field.name === 'lead_id' ? (
                            <input
                              id={`dashboard-deal-${field.name}`}
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
                                id={`dashboard-deal-${field.name}`}
                                name={field.name}
                                value={formData[field.name] ?? ''}
                                data-filled={formData[field.name] ? 'true' : 'false'}
                                onChange={(event) => handleChange(field.name, event.target.value)}
                              >
                                <option value="" hidden />
                                {(() => {
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
                          id={`dashboard-deal-${field.name}`}
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
                    저장
                  </button>
                  <button className="project-form__submit project-form__submit--danger" type="button" onClick={handleDelete}>
                    삭제
                  </button>
                  {errorMessage && <span className="form-error">{errorMessage}</span>}
                </div>
              </form>
              {showLogPanel && (
                <div className="deal-modal__logs">
                  <div className="deal-modal__logs-header">
                    <h4 className="deal-modal__logs-title">활동기록</h4>
                  </div>
                  <div className="deal-modal__logs-list">
                    {dealLogs.length === 0 && <p className="table__status">기록이 없습니다.</p>}
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
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirmState.open}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm || (() => setConfirmState({ open: false, message: '', onConfirm: null }))}
        onCancel={() => setConfirmState({ open: false, message: '', onConfirm: null })}
      />
    </>
  );
}

export default DashboardPage;
