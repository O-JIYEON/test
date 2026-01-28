import ReactApexChart from 'react-apexcharts';
import { useEffect, useMemo, useState } from 'react';
import ConfirmDialog from '../../components/ConfirmDialog';

const useCountUp = (value, duration = 300) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === null || value === undefined) {
      setDisplay(0);
      return;
    }
    const start = performance.now();
    const from = 0;
    const to = Number(value) || 0;
    let raf;
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const next = Math.round(from + (to - from) * progress);
      setDisplay(next);
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return display;
};

function DashboardPage() {
  const [deals, setDeals] = useState([]);
  const [lookupValues, setLookupValues] = useState([]);
  const [leads, setLeads] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [status, setStatus] = useState('loading');
  const [editingDeal, setEditingDeal] = useState(null);
  const [formData, setFormData] = useState({});
  const [formStatus, setFormStatus] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });
  const [periodMode, setPeriodMode] = useState('year');
  const [summaryPeriodMode, setSummaryPeriodMode] = useState('year');
  const [groupMode, setGroupMode] = useState('department');
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryDepartment, setSummaryDepartment] = useState('');
  const [summaryOwner, setSummaryOwner] = useState('');

  const showToast = (message, type = 'success') => {
    setToastType(type);
    setToastMessage(message);
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      setToastMessage('');
    }, 1500);
  };

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

  const filteredDeals = useMemo(() => {
    if (!deals.length) {
      return [];
    }
    return deals;
  }, [deals]);

  const getWonDateText = (deal) => formatDate(deal.won_date);
  const getWonYear = (deal) => {
    const text = getWonDateText(deal);
    return text ? text.slice(0, 4) : '';
  };
  const getWonMonth = (deal) => {
    const text = getWonDateText(deal);
    return text ? text.slice(0, 7) : '';
  };
  const getWonDay = (deal) => {
    const text = getWonDateText(deal);
    return text ? text.slice(0, 10) : '';
  };

  const monthlyDeals = useMemo(() => {
    if (!deals.length) {
      return [];
    }
    return deals.filter((deal) => {
      if (getStatus(deal) !== '수주') {
        return false;
      }
      return Boolean(getWonDateText(deal));
    });
  }, [deals]);

  const monthlyData = useMemo(() => {
    const buckets = {};
    if (periodMode === 'year') {
      deals.forEach((deal) => {
        if (getStatus(deal) !== '수주') {
          return;
        }
        const label = getWonYear(deal);
        if (!label) {
          return;
        }
        if (!buckets[label]) {
          buckets[label] = { label, actual: 0 };
        }
        buckets[label].actual += parseAmount(deal.expected_amount);
      });
      const entries = Object.values(buckets).sort((a, b) => (a.label > b.label ? 1 : -1));
      if (!entries.length) {
        return [];
      }
      return entries.map((item) => ({
        year: item.label,
        actual: item.actual,
        goal: Math.round(item.actual * 0.9)
      }));
    }
    monthlyDeals.forEach((deal) => {
      const label = getWonMonth(deal);
      if (!label) {
        return;
      }
      if (!buckets[label]) {
        buckets[label] = { label, actual: 0 };
      }
      buckets[label].actual += parseAmount(deal.expected_amount);
    });
    const entries = Object.values(buckets).sort((a, b) => (a.label > b.label ? 1 : -1));
    if (!entries.length) {
      return [];
    }
    return entries.map((item) => ({
      month: item.label,
      actual: item.actual,
      goal: Math.round(item.actual * 0.9)
    }));
  }, [monthlyDeals, periodMode, deals]);

  const monthlyLabels = monthlyData.map((item) => (periodMode === 'year' ? item.year : item.month));

  const monthlySeries = [
    { name: '목표', data: monthlyData.map((item) => item.goal) },
    { name: '실적달성액', data: monthlyData.map((item) => item.actual) }
  ];

  const [theme, setTheme] = useState(
    typeof document !== 'undefined' ? document.documentElement.dataset.theme || 'light' : 'light'
  );

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const target = document.documentElement;
    const observer = new MutationObserver(() => {
      setTheme(target.dataset.theme || 'light');
    });
    observer.observe(target, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const chartGapColor = theme === 'light' ? '#f8fafc' : '#0a0f1e';

  const monthlyOptions = {
    chart: {
      type: 'line',
      stacked: false,
      toolbar: { show: false }
    },
    stroke: {
      width: 3,
      curve: 'smooth'
    },
    markers: {
      size: 4,
      strokeWidth: 0
    },
    colors: ['#38bdf8', '#f97316'],
    dataLabels: {
      enabled: false
    },
    xaxis: {
      categories: monthlyLabels,
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
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      labels: { colors: '#94a3b8' }
    }
  };

  const overviewRaw = useMemo(() => {
    const now = new Date();
    const currentYear = Number(now.getFullYear());
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prevYear = String(currentYear - 1);
    const prevMonth = (() => {
      const year = now.getMonth() === 0 ? currentYear - 1 : currentYear;
      const month = now.getMonth() === 0 ? 12 : now.getMonth();
      return `${year}-${String(month).padStart(2, '0')}`;
    })();

    const won = filteredDeals.reduce((sum, deal) => {
      if (getStatus(deal) !== '수주') {
        return sum;
      }
      return sum + parseAmount(deal.expected_amount);
    }, 0);

    const yearWon = deals.reduce((sum, deal) => {
      if (getStatus(deal) !== '수주') {
        return sum;
      }
      if (getYearLabel(deal.won_date) !== String(currentYear)) {
        return sum;
      }
      return sum + parseAmount(deal.expected_amount);
    }, 0);

    const monthWon = deals.reduce((sum, deal) => {
      if (getStatus(deal) !== '수주') {
        return sum;
      }
      if (getMonthLabel(deal.won_date) !== currentMonth) {
        return sum;
      }
      return sum + parseAmount(deal.expected_amount);
    }, 0);

    const prevYearWon = deals.reduce((sum, deal) => {
      if (getStatus(deal) !== '수주') {
        return sum;
      }
      if (getYearLabel(deal.won_date) !== prevYear) {
        return sum;
      }
      return sum + parseAmount(deal.expected_amount);
    }, 0);

    const prevMonthWon = deals.reduce((sum, deal) => {
      if (getStatus(deal) !== '수주') {
        return sum;
      }
      if (getMonthLabel(deal.won_date) !== prevMonth) {
        return sum;
      }
      return sum + parseAmount(deal.expected_amount);
    }, 0);

    const yearDelta = prevYearWon > 0 ? ((yearWon - prevYearWon) / prevYearWon) * 100 : null;
    const monthDelta = prevMonthWon > 0 ? ((monthWon - prevMonthWon) / prevMonthWon) * 100 : null;

    const formatDelta = (value) => {
      if (value === null) {
        return '-';
      }
      const sign = value > 0 ? '+' : '';
      return `${sign}${value.toFixed(1)}%`;
    };

    const formatTooltip = (value, label) => {
      if (value === null) {
        return `${label} 데이터가 없습니다.`;
      }
      const direction = value >= 0 ? '증가' : '감소';
      return `${label} 대비 ${Math.abs(value).toFixed(1)}% ${direction}했습니다.`;
    };
    const formatDeltaParts = (value, label) => {
      if (value === null) {
        return { prefix: '-', trend: '', suffix: '' };
      }
      const direction = value >= 0 ? '증가' : '감소';
      return {
        prefix: `${label} 대비 `,
        trend: `${Math.abs(value).toFixed(1)}% ${direction}`,
        suffix: '했습니다.'
      };
    };

    return {
      won,
      yearWon,
      monthWon,
      yearDelta,
      monthDelta,
      formatDelta,
      formatTooltip,
      formatDeltaParts
    };
  }, [filteredDeals, deals]);

  const animatedTotalWon = useCountUp(overviewRaw.won, 500);
  const animatedYearWon = useCountUp(overviewRaw.yearWon, 500);
  const animatedMonthWon = useCountUp(overviewRaw.monthWon, 500);

  const overviewLeadCount = leads.filter((lead) => !lead.deleted_at && !lead.deletedAt).length;
  const overviewDealCount = deals.filter((deal) => !deal.deleted_at && !deal.deletedAt).length;
  const overviewWonCount = deals.filter(
    (deal) => !deal.deleted_at && !deal.deletedAt && getStatus(deal) === '수주'
  ).length;
  const leadToDealRate = overviewLeadCount ? (overviewDealCount / overviewLeadCount) * 100 : null;
  const dealToWonRate = overviewDealCount ? (overviewWonCount / overviewDealCount) * 100 : null;
  const animatedLeadToDealRate = useCountUp(leadToDealRate ?? 0, 500);
  const animatedDealToWonRate = useCountUp(dealToWonRate ?? 0, 500);

  const overviewStats = [
    { label: '총 수주액', value: formatAmount(animatedTotalWon) },
    {
      label: '금년 수주액',
      value: formatAmount(animatedYearWon),
      delta: overviewRaw.formatDelta(overviewRaw.yearDelta),
      deltaParts: overviewRaw.formatDeltaParts(overviewRaw.yearDelta, '전년'),
      deltaClass:
        overviewRaw.yearDelta === null
          ? ''
          : overviewRaw.yearDelta >= 0
            ? 'dashboard__overview-delta--up'
            : 'dashboard__overview-delta--down',
      deltaTooltip: overviewRaw.formatTooltip(overviewRaw.yearDelta, '전년')
    },
    {
      label: '당월 수주액',
      value: formatAmount(animatedMonthWon),
      delta: overviewRaw.formatDelta(overviewRaw.monthDelta),
      deltaParts: overviewRaw.formatDeltaParts(overviewRaw.monthDelta, '전월'),
      deltaClass:
        overviewRaw.monthDelta === null
          ? ''
          : overviewRaw.monthDelta >= 0
            ? 'dashboard__overview-delta--up'
            : 'dashboard__overview-delta--down',
      deltaTooltip: overviewRaw.formatTooltip(overviewRaw.monthDelta, '전월')
    },
    {
      label: '리드 → 딜 전환율',
      value: leadToDealRate === null ? '-' : animatedLeadToDealRate.toFixed(1),
      unit: '%'
    },
    {
      label: '딜 → 수주 전환율',
      value: dealToWonRate === null ? '-' : animatedDealToWonRate.toFixed(1),
      unit: '%'
    }
  ];

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
      });
  }, [filteredDeals]);

  const activeLeadsCount = useMemo(() => {
    return leads.filter((lead) => !lead.deleted_at && !lead.deletedAt).length;
  }, [leads]);

  const activeDealsCount = useMemo(() => {
    return deals.filter((deal) => !deal.deleted_at && !deal.deletedAt).length;
  }, [deals]);

  const wonDealsCount = useMemo(() => {
    return deals.filter(
      (deal) => !deal.deleted_at && !deal.deletedAt && getStatus(deal) === '수주'
    ).length;
  }, [deals]);

  const formatRate = (numerator, denominator) => {
    if (!denominator) {
      return '-';
    }
    return `${((numerator / denominator) * 100).toFixed(1)}%`;
  };

  const ownerSummary = useMemo(() => {
    const acc = {};
    const ensure = (owner) => {
      const key = owner || '미지정';
      if (!acc[key]) {
        acc[key] = {
          owner: key,
          leadCount: 0,
          dealCount: 0,
          wonCount: 0,
          wonAmount: 0,
          weightedAmount: 0
        };
      }
      return acc[key];
    };

    leads.forEach((lead) => {
      if (lead.deleted_at || lead.deletedAt) {
        return;
      }
      ensure(lead.customer_owner).leadCount += 1;
    });

    deals.forEach((deal) => {
      if (deal.deleted_at || deal.deletedAt) {
        return;
      }
      const entry = ensure(deal.customer_owner);
      entry.dealCount += 1;
      const amount = parseAmount(deal.expected_amount);
      const probability = Number(probabilityByStage[deal.stage] ?? 0);
      entry.weightedAmount += amount * (Number.isNaN(probability) ? 0 : probability / 100);
      if (getStatus(deal) === '수주') {
        entry.wonCount += 1;
        entry.wonAmount += amount;
      }
    });

    return Object.values(acc).sort((a, b) => b.wonAmount - a.wonAmount);
  }, [leads, deals, probabilityByStage]);

  const statusTrend = useMemo(() => {
    const leadMap = {};
    const dealMap = {};
    const wonMap = {};

    const addCount = (map, key) => {
      if (!key) {
        return;
      }
      map[key] = (map[key] || 0) + 1;
    };

    leads.forEach((lead) => {
      if (lead.deleted_at || lead.deletedAt) {
        return;
      }
      const key = periodMode === 'year' ? getYearLabel(lead.created_at) : getMonthLabel(lead.created_at);
      addCount(leadMap, key);
    });

    deals.forEach((deal) => {
      if (deal.deleted_at || deal.deletedAt) {
        return;
      }
      const key = periodMode === 'year' ? getYearLabel(deal.created_at) : getMonthLabel(deal.created_at);
      addCount(dealMap, key);
      if (getStatus(deal) === '수주') {
        const wonKey =
          periodMode === 'year' ? getYearLabel(deal.won_date) : getMonthLabel(deal.won_date);
        addCount(wonMap, wonKey);
      }
    });

    const keys = Array.from(
      new Set([...Object.keys(leadMap), ...Object.keys(dealMap), ...Object.keys(wonMap)])
    ).sort();

    return {
      categories: keys,
      series: [
        { name: '유입리드수', data: keys.map((key) => leadMap[key] || 0) },
        { name: '딜수', data: keys.map((key) => dealMap[key] || 0) },
        { name: '수주 수', data: keys.map((key) => wonMap[key] || 0) }
      ]
    };
  }, [leads, deals, periodMode]);

  const ownerDepartmentMap = useMemo(() => {
    return lookupValues.reduce((acc, value) => {
      if (value.category_label !== '담당자') {
        return acc;
      }
      if (value.label) {
        acc[value.label] = value.department || '';
      }
      return acc;
    }, {});
  }, [lookupValues]);

  const departmentOptions = useMemo(() => {
    const set = new Set();
    Object.values(ownerDepartmentMap).forEach((dept) => {
      if (dept) {
        set.add(dept);
      }
    });
    return Array.from(set).sort();
  }, [ownerDepartmentMap]);

  const ownerOptions = useMemo(() => {
    return lookupValues
      .filter((value) => value.category_label === '담당자')
      .sort((a, b) => {
        const aOrder = Number(a.sort_order) || 0;
        const bOrder = Number(b.sort_order) || 0;
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        return String(a.label || '').localeCompare(String(b.label || ''), 'ko');
      })
      .map((value) => value.label)
      .filter(Boolean);
  }, [lookupValues]);

  const groupedSummary = useMemo(() => {
    const now = new Date();
    const currentYear = String(now.getFullYear());
    const currentMonth = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const useYear = periodMode === 'year';
    const keyForOwner = (owner) => owner || '미지정';
    const keyForDepartment = (owner) => {
      const dept = owner ? ownerDepartmentMap[owner] : '';
      return dept || '미지정';
    };
    const getGroupKey = (owner) => (groupMode === 'owner' ? keyForOwner(owner) : keyForDepartment(owner));

    const counts = {};
    const ensure = (key) => {
      if (!counts[key]) {
        counts[key] = { leadCount: 0, dealCount: 0, wonCount: 0 };
      }
      return counts[key];
    };

    leads.forEach((lead) => {
      if (lead.deleted_at || lead.deletedAt) {
        return;
      }
      const createdKey = useYear ? getYearLabel(lead.created_at) : getMonthLabel(lead.created_at);
      if (!createdKey) {
        return;
      }
      if (useYear && createdKey !== currentYear) {
        return;
      }
      if (!useYear && createdKey !== currentMonth) {
        return;
      }
      const key = getGroupKey(lead.customer_owner);
      ensure(key).leadCount += 1;
    });

    deals.forEach((deal) => {
      if (deal.deleted_at || deal.deletedAt) {
        return;
      }
      const createdKey = useYear ? getYearLabel(deal.created_at) : getMonthLabel(deal.created_at);
      if (!createdKey) {
        return;
      }
      if (useYear && createdKey !== currentYear) {
        return;
      }
      if (!useYear && createdKey !== currentMonth) {
        return;
      }
      const key = getGroupKey(deal.customer_owner);
      ensure(key).dealCount += 1;
      if (getStatus(deal) === '수주') {
        const wonKey = useYear ? getYearLabel(deal.won_date) : getMonthLabel(deal.won_date);
        if (wonKey && ((useYear && wonKey === currentYear) || (!useYear && wonKey === currentMonth))) {
          ensure(key).wonCount += 1;
        }
      }
    });

    const categories = Object.keys(counts);
    return {
      categories,
      series: [
        { name: '유입리드수', data: categories.map((key) => counts[key].leadCount) },
        { name: '딜수', data: categories.map((key) => counts[key].dealCount) },
        { name: '수주 수', data: categories.map((key) => counts[key].wonCount) }
      ]
    };
  }, [leads, deals, periodMode, groupMode, ownerDepartmentMap]);

  const summaryRows = useMemo(() => {
    return groupedSummary.categories
      .map((key, index) => {
        const leadCount = groupedSummary.series[0]?.data[index] ?? 0;
        const dealCount = groupedSummary.series[1]?.data[index] ?? 0;
        const wonCount = groupedSummary.series[2]?.data[index] ?? 0;
        const amounts =
          groupMode === 'department'
            ? ownerSummary.filter((row) => (ownerDepartmentMap[row.owner] || '미지정') === key)
            : ownerSummary.filter((row) => row.owner === key);
        const wonAmount = amounts.reduce((sum, row) => sum + row.wonAmount, 0);
        const weightedAmount = amounts.reduce((sum, row) => sum + row.weightedAmount, 0);
        return {
          key,
          leadCount,
          dealCount,
          wonCount,
          wonAmount,
          weightedAmount
        };
      })
      .sort((a, b) => {
        if (b.wonAmount !== a.wonAmount) {
          return b.wonAmount - a.wonAmount;
        }
        return b.weightedAmount - a.weightedAmount;
      });
  }, [groupedSummary, groupMode, ownerSummary, ownerDepartmentMap]);

  const buildOverviewStats = (dealList) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prevYear = String(currentYear - 1);
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

    const won = dealList.reduce((sum, deal) => {
      if (getStatus(deal) !== '수주') {
        return sum;
      }
      return sum + parseAmount(deal.expected_amount);
    }, 0);

    const yearWon = dealList.reduce((sum, deal) => {
      if (getStatus(deal) !== '수주') {
        return sum;
      }
      if (getYearLabel(deal.won_date) !== String(currentYear)) {
        return sum;
      }
      return sum + parseAmount(deal.expected_amount);
    }, 0);

    const monthWon = dealList.reduce((sum, deal) => {
      if (getStatus(deal) !== '수주') {
        return sum;
      }
      if (getMonthLabel(deal.won_date) !== currentMonth) {
        return sum;
      }
      return sum + parseAmount(deal.expected_amount);
    }, 0);

    const prevYearWon = dealList.reduce((sum, deal) => {
      if (getStatus(deal) !== '수주') {
        return sum;
      }
      if (getYearLabel(deal.won_date) !== prevYear) {
        return sum;
      }
      return sum + parseAmount(deal.expected_amount);
    }, 0);

    const prevMonthWon = dealList.reduce((sum, deal) => {
      if (getStatus(deal) !== '수주') {
        return sum;
      }
      if (getMonthLabel(deal.won_date) !== prevMonth) {
        return sum;
      }
      return sum + parseAmount(deal.expected_amount);
    }, 0);

    const yearDelta = prevYearWon > 0 ? ((yearWon - prevYearWon) / prevYearWon) * 100 : null;
    const monthDelta = prevMonthWon > 0 ? ((monthWon - prevMonthWon) / prevMonthWon) * 100 : null;
    const formatDelta = (value) => {
      if (value === null) {
        return '-';
      }
      const sign = value > 0 ? '+' : '';
      return `${sign}${value.toFixed(1)}%`;
    };
    const formatTooltip = (value, label) => {
      if (value === null) {
        return `${label} 데이터가 없습니다.`;
      }
      const direction = value >= 0 ? '증가' : '감소';
      return `${label} 대비 ${Math.abs(value).toFixed(1)}% ${direction}했습니다.`;
    };

    return [
      { label: '총 수주액', value: formatAmount(won) },
      {
        label: '금년 수주액',
        value: formatAmount(yearWon),
        delta: formatDelta(yearDelta),
        deltaClass:
          yearDelta === null
            ? ''
            : yearDelta >= 0
              ? 'dashboard__overview-delta--up'
              : 'dashboard__overview-delta--down',
        deltaTooltip: formatTooltip(yearDelta, '전년')
      },
      {
        label: '당월 수주액',
        value: formatAmount(monthWon),
        delta: formatDelta(monthDelta),
        deltaClass:
          monthDelta === null
            ? ''
            : monthDelta >= 0
              ? 'dashboard__overview-delta--up'
              : 'dashboard__overview-delta--down',
        deltaTooltip: formatTooltip(monthDelta, '전월')
      }
    ];
  };

  const buildMonthlyData = (dealList, mode = 'month') => {
    const buckets = {};
    dealList.forEach((deal) => {
      if (getStatus(deal) !== '수주') {
        return;
      }
      const label = mode === 'year' ? getYearLabel(deal.won_date) : getMonthLabel(deal.won_date);
      if (!label) {
        return;
      }
      if (!buckets[label]) {
        buckets[label] = { label, actual: 0 };
      }
      buckets[label].actual += parseAmount(deal.expected_amount);
    });
    const entries = Object.values(buckets).sort((a, b) => (a.label > b.label ? 1 : -1));
    if (!entries.length) {
      return [];
    }
    return entries.map((item) => ({
      month: item.label,
      actual: item.actual,
      goal: Math.round(item.actual * 0.9)
    }));
  };

  const openSummaryModal = (key) => {
    if (groupMode === 'department') {
      setSummaryDepartment(key);
      setSummaryOwner('');
    } else {
      setSummaryOwner(key);
      setSummaryDepartment('');
    }
    setIsSummaryModalOpen(true);
  };

  const summaryLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (lead.deleted_at || lead.deletedAt) {
        return false;
      }
      if (summaryOwner) {
        return lead.customer_owner === summaryOwner;
      }
      if (summaryDepartment) {
        return (ownerDepartmentMap[lead.customer_owner] || '') === summaryDepartment;
      }
      return true;
    });
  }, [leads, summaryOwner, summaryDepartment, ownerDepartmentMap]);

  const summaryDeals = useMemo(() => {
    return deals.filter((deal) => {
      if (deal.deleted_at || deal.deletedAt) {
        return false;
      }
      if (summaryOwner) {
        return deal.customer_owner === summaryOwner;
      }
      if (summaryDepartment) {
        return (ownerDepartmentMap[deal.customer_owner] || '') === summaryDepartment;
      }
      return true;
    });
  }, [deals, summaryOwner, summaryDepartment, ownerDepartmentMap]);

  const pipelineStages = stageOptions;

  const summaryLeadMap = useMemo(() => {
    return summaryLeads.reduce((acc, lead) => {
      acc[lead.id] = lead;
      return acc;
    }, {});
  }, [summaryLeads]);

  const summaryConversion = useMemo(() => {
    const leadCount = summaryLeads.length;
    const dealCount = summaryDeals.length;
    const wonCount = summaryDeals.filter((deal) => getStatus(deal) === '수주').length;
    const leadToDeal = leadCount ? (dealCount / leadCount) * 100 : null;
    const dealToWon = dealCount ? (wonCount / dealCount) * 100 : null;

    const diffDays = summaryDeals
      .map((deal) => {
        const lead = summaryLeadMap[deal.lead_id];
        if (!lead?.created_at || !deal.created_at) {
          return null;
        }
        const leadDate = new Date(String(lead.created_at));
        const dealDate = new Date(String(deal.created_at));
        if (Number.isNaN(leadDate.getTime()) || Number.isNaN(dealDate.getTime())) {
          return null;
        }
        const diffTime = dealDate.getTime() - leadDate.getTime();
        return Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));
      })
      .filter((value) => value !== null);
    const avgLeadDays = diffDays.length ? Math.round(diffDays.reduce((a, b) => a + b, 0) / diffDays.length) : null;

    return {
      leadCount,
      dealCount,
      wonCount,
      leadToDeal,
      dealToWon,
      avgLeadDays
    };
  }, [summaryDeals, summaryLeads, summaryLeadMap]);

  const summaryLossReasons = useMemo(() => {
    const counts = summaryDeals.reduce((acc, deal) => {
      if (getStatus(deal) !== '실주') {
        return acc;
      }
      const reason = deal.loss_reason || '';
      if (!reason) {
        return acc;
      }
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [summaryDeals]);
  const summaryLossTotal = useMemo(
    () =>
      summaryDeals.reduce((acc, deal) => (getStatus(deal) === '실주' ? acc + 1 : acc), 0),
    [summaryDeals]
  );

  const summaryUpcomingDeals = useMemo(() => {
    const today = new Date();
    const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const toDays = (value) => {
      if (!value) return null;
      const date = new Date(String(value).slice(0, 10) + 'T00:00:00');
      if (Number.isNaN(date.getTime())) return null;
      return Math.ceil((date.getTime() - base.getTime()) / (1000 * 60 * 60 * 24));
    };
    return summaryDeals
      .filter((deal) => !['수주', '실주'].includes(getStatus(deal)))
      .map((deal) => ({ ...deal, dday: toDays(deal.next_action_date) }))
      .filter((deal) => deal.dday !== null)
      .sort((a, b) => a.dday - b.dday)
      .slice(0, 5);
  }, [summaryDeals]);

  const summaryOverviewStats = useMemo(() => buildOverviewStats(summaryDeals), [summaryDeals]);
  const summaryTopCards = useMemo(
    () => [
      ...summaryOverviewStats,
      {
        label: '리드 → 딜',
        value: summaryConversion.leadToDeal === null ? '-' : `${summaryConversion.leadToDeal.toFixed(1)}%`
      },
      {
        label: '딜 → 수주',
        value: summaryConversion.dealToWon === null ? '0.0%' : `${summaryConversion.dealToWon.toFixed(1)}%`
      }
    ],
    [summaryOverviewStats, summaryConversion]
  );
  const summaryMonthlyData = useMemo(
    () => buildMonthlyData(summaryDeals, summaryPeriodMode === 'year' ? 'year' : 'month'),
    [summaryDeals, summaryPeriodMode]
  );
  const summaryMonthlySeries = [
    { name: '목표', data: summaryMonthlyData.map((item) => item.goal) },
    { name: '실적달성액', data: summaryMonthlyData.map((item) => item.actual) }
  ];
  const summaryMonthlyOptions = {
    ...monthlyOptions,
    dataLabels: {
      enabled: false
    },
    xaxis: {
      ...monthlyOptions.xaxis,
      categories: summaryMonthlyData.map((item) => item.month)
    }
  };
  const summaryPipelineSeries = useMemo(() => {
    const sums = summaryDeals.reduce((acc, deal) => {
      const amount = parseAmount(deal.expected_amount);
      const stage = deal.stage || '미지정';
      acc[stage] = (acc[stage] || 0) + amount;
      return acc;
    }, {});
    return [{ name: '금액 합계', data: pipelineStages.map((stage) => sums[stage] || 0) }];
  }, [summaryDeals, pipelineStages]);
  const summaryStatusTrend = useMemo(() => {
    const leadMap = {};
    const dealMap = {};
    const wonMap = {};
    const addCount = (map, key) => {
      if (!key) return;
      map[key] = (map[key] || 0) + 1;
    };
    summaryLeads.forEach((lead) => {
      const key = periodMode === 'year' ? getYearLabel(lead.created_at) : getMonthLabel(lead.created_at);
      addCount(leadMap, key);
    });
    summaryDeals.forEach((deal) => {
      const key = periodMode === 'year' ? getYearLabel(deal.created_at) : getMonthLabel(deal.created_at);
      addCount(dealMap, key);
      if (getStatus(deal) === '수주') {
        const wonKey = periodMode === 'year' ? getYearLabel(deal.won_date) : getMonthLabel(deal.won_date);
        addCount(wonMap, wonKey);
      }
    });
    const keys = Array.from(new Set([...Object.keys(leadMap), ...Object.keys(dealMap), ...Object.keys(wonMap)])).sort();
    return {
      categories: keys,
      series: [
        { name: '유입리드수', data: keys.map((key) => leadMap[key] || 0) },
        { name: '딜수', data: keys.map((key) => dealMap[key] || 0) },
        { name: '수주 수', data: keys.map((key) => wonMap[key] || 0) }
      ]
    };
  }, [summaryLeads, summaryDeals, periodMode]);

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
      showToast('저장되었습니다.', 'success');
    } catch (error) {
      console.error(error);
      setFormStatus('');
      showToast('저장에 실패했습니다.', 'error');
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
      showToast('삭제되었습니다.', 'success');
    } catch (error) {
      console.error(error);
      showToast('삭제에 실패했습니다.', 'error');
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

  const pipelineColors = ['#2563eb', '#16a34a', '#ef4444', '#f59e0b', '#7c3aed', '#14b8a6'];

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

  const pipelineOptions = useMemo(
    () => ({
    chart: {
      type: 'bar',
      toolbar: { show: false },
      width: '100%'
    },
    colors: pipelineColors,
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
        distributed: true,
        dataLabels: {
          position: 'center'
        }
      }
    },
    foreColor: theme === 'dark' ? '#e2e8f0' : '#64748b',
    xaxis: {
      categories: pipelineStages,
      labels: {
        formatter: (value) => `${(value / 100000000).toFixed(1)}억`,
        style: { colors: theme === 'dark' ? '#e2e8f0' : '#64748b' }
      }
    },
    yaxis: {
      labels: {
        show: false
      }
    },
    grid: {
      padding: {
        left: 0,
        right: 10
      },
      borderColor: 'rgba(148, 163, 184, 0.15)'
    },
    tooltip: {
      y: {
        formatter: (value) => `${Number(value).toLocaleString('ko-KR')}원`
      }
    }
  }),
  [pipelineStages, theme]
  );

  const pipelineStatusOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false }
    },
    colors: ['#38bdf8', '#f97316', '#22c55e'],
    dataLabels: {
      enabled: true,
      offsetY: -40,
      style: {
        colors: [
          typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark' ? '#f8fafc' : '#0f172a'
        ],
        fontSize: '11px',
        fontWeight: 600
      }
    },
    plotOptions: {
      bar: {
        columnWidth: '22px',
        borderRadius: 4,
        dataLabels: {
          position: 'top'
        }
      }
    },
    xaxis: {
      categories: statusTrend.categories,
      labels: { style: { colors: '#94a3b8' } }
    },
    yaxis: {
      labels: { style: { colors: '#94a3b8' } }
    },
    grid: { borderColor: 'rgba(148, 163, 184, 0.15)' },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      labels: { colors: '#94a3b8' }
    },
    tooltip: {
      y: {
        formatter: (value) => `${value}건`
      }
    }
  };

  const summaryStatusOptions = {
    ...pipelineStatusOptions,
    xaxis: {
      ...pipelineStatusOptions.xaxis,
      categories: summaryStatusTrend.categories
    }
  };

  return (
    <>
      <section className="content__section content__section--single">
        <div className="dashboard">
          <div className="dashboard__overview">
            <div className="dashboard__overview-cards dashboard__overview-cards--hero">
              {overviewStats.map((item) => (
                <div className="dashboard__overview-card dashboard__overview-card--hero" key={item.label}>
                  <div className="dashboard__overview-content">
                    <span className="dashboard__overview-label">{item.label}</span>
                    <strong className="dashboard__overview-value">
                      {item.value}
                      {item.label.includes('수주액') && <span className="dashboard__overview-unit">원</span>}
                      {item.unit && item.value !== '-' && <span className="dashboard__overview-unit">{item.unit}</span>}
                    </strong>
                    {item.delta && (
                      <em className="dashboard__overview-delta">
                        {item.deltaParts?.prefix === '-' ? '-' : item.deltaParts?.prefix || ''}
                        <span className={`dashboard__overview-delta-text ${item.deltaClass || ''}`}>
                          {item.deltaParts?.prefix === '-' ? '' : item.deltaParts?.trend || item.delta}
                        </span>
                        {item.deltaParts?.prefix === '-' ? '' : item.deltaParts?.suffix || ''}
                      </em>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard__section">
            <div className="dashboard__section-header">
              <div className="dashboard__section-title">수주액</div>
              <div className="dashboard__period">
                  <div className="dashboard__period-toggle" data-active-index={summaryPeriodMode === 'month' ? '1' : '0'}>
                    <button
                      type="button"
                      className={`dashboard__period-btn${summaryPeriodMode === 'year' ? ' dashboard__period-btn--active' : ''}`}
                      onClick={() => setSummaryPeriodMode('year')}
                    >
                      연도별
                    </button>
                    <button
                      type="button"
                      className={`dashboard__period-btn${summaryPeriodMode === 'month' ? ' dashboard__period-btn--active' : ''}`}
                      onClick={() => setSummaryPeriodMode('month')}
                    >
                      월별
                    </button>
                  </div>
              </div>
            </div>
            <div className="dashboard__chart">
              <div className="dashboard__chart-canvas">
                {monthlyData.length === 0 ? (
                  <p className="table__status table__status--centered">데이터가 없습니다.</p>
                ) : (
                  <ReactApexChart options={monthlyOptions} series={monthlySeries} type="line" height={240} />
                )}
              </div>
            </div>
          </div>

          <div className="dashboard__bottom">
            <div className="dashboard__section">
              <div className="dashboard__section-header dashboard__section-header--split">
                <div className="dashboard__section-title">PipeLine Analysis</div>
                <div className="dashboard__section-title">상태별 건수</div>
              </div>
                <div className="dashboard__pipeline-row">
                  <div className="dashboard__pipeline">
                    <div className="dashboard__pipeline-visual dashboard__pipeline-chart">
                      {pipelineSeries[0]?.data?.every((value) => !value) ? (
                        <p className="table__status table__status--centered">데이터가 없습니다.</p>
                      ) : (
                        <ReactApexChart
                          key={`pipeline-${theme}-${pipelineStages.join('-')}`}
                          options={pipelineOptions}
                          series={pipelineSeries}
                          type="bar"
                          height={200}
                        />
                      )}
                    </div>
                  </div>
                <div className="dashboard__pipeline-stats-wrapper">
                  <div className="dashboard__pipeline-stats">
                    <div className="dashboard__pipeline-stats-chart">
                      {statusTrend.categories.length === 0 ? (
                        <p className="table__status table__status--centered">데이터가 없습니다.</p>
                      ) : (
                        <ReactApexChart options={pipelineStatusOptions} series={statusTrend.series} type="bar" height={200} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="dashboard__deal-row">
            <div className="dashboard__section">
              <div className="dashboard__section-header">
                <div className="dashboard__section-title">
                  {groupMode === 'department' ? '부서별 요약' : '담당자별 요약'}
                </div>
                <div className="dashboard__period-toggle" data-active-index={groupMode === 'owner' ? '1' : '0'}>
                  <button
                    type="button"
                    className={`dashboard__period-btn${groupMode === 'department' ? ' dashboard__period-btn--active' : ''}`}
                    onClick={() => setGroupMode('department')}
                  >
                    부서별
                  </button>
                  <button
                    type="button"
                    className={`dashboard__period-btn${groupMode === 'owner' ? ' dashboard__period-btn--active' : ''}`}
                    onClick={() => setGroupMode('owner')}
                  >
                    담당자별
                  </button>
                </div>
              </div>
              <div className="dashboard__table dashboard__table--scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      {groupMode === 'department' ? (
                        <>
                          <th>부서</th>
                          <th>수주매출</th>
                          <th>가중금액</th>
                          <th>리드수</th>
                          <th>딜수</th>
                          <th>수주수</th>
                        </>
                      ) : (
                        <>
                          <th>부서</th>
                          <th>담당자</th>
                          <th>수주매출</th>
                          <th>가중금액</th>
                          <th>리드수</th>
                          <th>딜수</th>
                          <th>수주수</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {summaryRows.length === 0 && (
                      <tr className="data-table__row data-table__row--empty">
                        <td colSpan={groupMode === 'department' ? 6 : 7} className="data-table__empty">데이터가 없습니다.</td>
                      </tr>
                    )}
                    {summaryRows.map((row) => {
                      if (groupMode === 'department') {
                        return (
                          <tr key={row.key} className="data-table__row" onClick={() => openSummaryModal(row.key)}>
                            <td>{row.key}</td>
                            <td>{formatAmount(row.wonAmount)}</td>
                            <td>{formatAmount(Math.round(row.weightedAmount))}</td>
                            <td>{row.leadCount}</td>
                            <td>{row.dealCount}</td>
                            <td>{row.wonCount}</td>
                          </tr>
                        );
                      }
                      return (
                        <tr key={row.key} className="data-table__row" onClick={() => openSummaryModal(row.key)}>
                          <td>{ownerDepartmentMap[row.key] || '미지정'}</td>
                          <td>{row.key}</td>
                          <td>{formatAmount(row.wonAmount)}</td>
                          <td>{formatAmount(Math.round(row.weightedAmount))}</td>
                          <td>{row.leadCount}</td>
                          <td>{row.dealCount}</td>
                          <td>{row.wonCount}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="dashboard__section">
              <div className="dashboard__section-title">진행중인 딜</div>
              <div className="dashboard__table dashboard__table--scroll">
                <div className="table__wrapper">
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
                        <tr className="data-table__row data-table__row--empty">
                          <td colSpan={5} className="data-table__empty">데이터가 없습니다.</td>
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
                          <td className="dashboard__deal-nowrap">{deal.company || '-'}</td>
                          <td>{deal.project_name || '-'}</td>
                          <td className="dashboard__deal-nowrap">{formatAmount(parseAmount(deal.expected_amount))}</td>
                          <td>{deal.stage ? `${probabilityByStage[deal.stage] ?? 0}%` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {isSummaryModalOpen && (
        <div className="modal dashboard-summary-modal__wrap">
          <div className="modal__overlay" onClick={() => setIsSummaryModalOpen(false)} />
          <div className="modal__content modal__content--white dashboard-summary-modal" role="dialog" aria-modal="true">
            <div className="modal__header">
              <div className="modal__title-row modal__title-row--spaced">
                <h3>요약 상세</h3>
                <button className="icon-button" type="button" onClick={() => setIsSummaryModalOpen(false)} aria-label="닫기">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6.4 5l12.6 12.6-1.4 1.4L5 6.4 6.4 5z" />
                    <path d="M19 6.4 6.4 19l-1.4-1.4L17.6 5 19 6.4z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="modal__body dashboard-summary-modal__body">
              <div className="dashboard-summary-modal__left">
                <div className="dashboard-summary-modal__panel">
                  <h4>부서 목록</h4>
                  <div className="dashboard-summary-modal__list">
                    {departmentOptions.length === 0 && <p className="table__status">데이터가 없습니다.</p>}
                    {departmentOptions.map((dept) => (
                      <button
                        key={dept}
                        type="button"
                        className={`summary-chip${summaryDepartment === dept ? ' summary-chip--active' : ''}`}
                        onClick={() => {
                          setSummaryDepartment(dept);
                          setSummaryOwner('');
                        }}
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="dashboard-summary-modal__panel">
                  <h4>담당자 목록</h4>
                  <div className="dashboard-summary-modal__list">
                    {ownerOptions.length === 0 && <p className="table__status">데이터가 없습니다.</p>}
                    {ownerOptions.map((owner) => (
                      <button
                        key={owner}
                        type="button"
                        className={`summary-chip${summaryOwner === owner ? ' summary-chip--active' : ''}`}
                        onClick={() => {
                          setSummaryOwner(owner);
                          setSummaryDepartment('');
                        }}
                      >
                        {owner}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="dashboard-summary-modal__right">
                <div className="dashboard__overview dashboard__overview--compact">
                  <div className="dashboard__overview-cards dashboard__overview-cards--summary">
                    {summaryTopCards.map((item) => (
                      <div className="dashboard__overview-card" key={item.label}>
                        <span>{item.label}</span>
                        <strong>
                          {item.value}
                          {item.delta && (
                            <em
                              className={`dashboard__overview-delta ${item.deltaClass || ''}`}
                              data-tooltip={item.deltaTooltip || ''}
                            >
                              {item.delta}
                            </em>
                          )}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="dashboard-summary-modal__charts">
                  <div className="dashboard-summary-modal__charts-header">
                    <div />
                    <div className="dashboard__period-toggle" data-active-index={periodMode === 'month' ? '1' : '0'}>
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
                  </div>
                  <div className="dashboard-summary-modal__row">
                    <div className="dashboard__section">
                      <div className="dashboard__section-header">
                        <div className="dashboard__section-title">수주액</div>
                      </div>
                      <div className="dashboard__chart">
                        <div className="dashboard__chart-canvas">
                          {summaryMonthlyData.length === 0 ? (
                            <p className="table__status table__status--centered">데이터가 없습니다.</p>
                          ) : (
                            <ReactApexChart options={summaryMonthlyOptions} series={summaryMonthlySeries} type="line" height={220} />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="dashboard__section">
                      <div className="dashboard__section-title">상태별 건수</div>
                      <div className="dashboard__pipeline-stats-wrapper">
                        <div className="dashboard__pipeline-stats">
                          <div className="dashboard__pipeline-stats-chart">
                            {summaryStatusTrend.categories.length === 0 ? (
                              <p className="table__status table__status--centered">데이터가 없습니다.</p>
                            ) : (
                              <ReactApexChart options={summaryStatusOptions} series={summaryStatusTrend.series} type="bar" height={220} />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`dashboard-summary-modal__upcoming-grid${summaryLossReasons.length === 0 ? ' dashboard-summary-modal__upcoming-grid--full' : ''}`}>
                  <div className="dashboard-summary-modal__upcoming">
                    <div className="dashboard__section-title">다음액션 임박 딜</div>
                    <div className="dashboard__table">
                      <table className="data-table">
                        <thead>
                        <tr>
                          <th>Deal ID</th>
                          <th>회사명</th>
                          <th>담당자(영업)</th>
                          <th>다음액션내용</th>
                          <th>다음액션일</th>
                        </tr>
                        </thead>
                        <tbody>
                          {summaryUpcomingDeals.length === 0 && (
                          <tr className="data-table__row data-table__row--empty">
                            <td colSpan={5} className="data-table__empty">데이터가 없습니다.</td>
                          </tr>
                          )}
                          {summaryUpcomingDeals.map((deal) => (
                            <tr key={deal.id} className="data-table__row">
                            <td>{deal.deal_code || deal.id}</td>
                            <td>{deal.company || '-'}</td>
                            <td>{deal.customer_owner || '-'}</td>
                            <td>{deal.next_action_content || '-'}</td>
                            <td>
                              {formatDate(deal.next_action_date) || '-'}
                              {deal.dday !== null && (
                                <span className="dashboard-summary-modal__upcoming-dday">
                                  {deal.dday === 0 ? ' (D-0)' : deal.dday > 0 ? ` (D-${deal.dday})` : ` (D+${Math.abs(deal.dday)})`}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {summaryLossReasons.length > 0 && (
                  <div className="dashboard-summary-modal__loss">
                    <div className="dashboard__section-title">실주 사유 Top 3</div>
                    <div className="dashboard-summary-modal__loss--card">
                      <div className="dashboard-summary-modal__loss-list">
                        {summaryLossReasons.map(([reason, count], index) => {
                          const percent = summaryLossTotal === 0 ? 0 : (count / summaryLossTotal) * 100;
                          return (
                            <div className="dashboard-summary-modal__loss-item" key={reason}>
                              <span className="dashboard-summary-modal__loss-rank">{index + 1}</span>
                              <span className="dashboard-summary-modal__loss-reason">{reason}</span>
                              <strong className="dashboard-summary-modal__loss-percent">{percent.toFixed(1)}%</strong>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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
      {toastMessage && <div className={`toast toast--${toastType}`}>{toastMessage}</div>}
    </>
  );
}

export default DashboardPage;
