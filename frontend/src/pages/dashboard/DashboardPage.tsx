import ReactApexChart from 'react-apexcharts';
import ApexCharts from 'apexcharts';
import { useEffect, useMemo, useState } from 'react';
import ConfirmDialog from '../../components/dialogs/ConfirmDialog';
import '../../components/dialogs/modal.css';
import Toast from '../../components/feedback/Toast';
import Loading from '../../components/feedback/Loading';
import trashIcon from '../../assets/icon/trash.svg';
import penLineIcon from '../../assets/icon/penLine.svg';
import SummaryModal from './components/SummaryModal';
import GoalModal from './components/GoalModal';
import GoalFormModal from './components/GoalFormModal';
import DealEditModal from './components/DealEditModal';
import { fetchDeals, updateDeal, deleteDeal } from '../../api/deals.api';
import { fetchLeads } from '../../api/leads.api';
import { fetchActivityLogs } from '../../api/activities.api';
import { fetchLookupValues } from '../../api/lookup.api';
import { fetchGoals, upsertGoal, deleteGoal } from '../../api/goals.api';
import dayjs, {
  formatDate as formatDateValue,
  parseDateOnly,
  normalizeDateForCompare
} from '../../utils/date';
import './dashboard.css';

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
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [loadingActivityLogs, setLoadingActivityLogs] = useState(true);
  const [loadingLookupValues, setLoadingLookupValues] = useState(true);
  const [loadingGoals, setLoadingGoals] = useState(true);
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
  const [goals, setGoals] = useState([]);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const [goalFormInput, setGoalFormInput] = useState({ period: '', amount: '' });
  const [goalFormMode, setGoalFormMode] = useState('create');
  const [goalTab, setGoalTab] = useState('year');

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
      수주: 100
    };
  }, [lookupValues]);

  const stageOptions = useMemo(() => {
    const stages = lookupValues
      .filter((value) => value.category_label === '파이프라인 단계')
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((value) => value.label)
      .filter(Boolean);
    return stages.length
      ? stages.filter((stage) => stage !== '실주')
      : ['자격확인(가능성판단)', '요구사항/기술검토', '제안/견적', '협상/계약', '수주'];
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

  const formatDate = (value) => formatDateValue(value);

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
    const parsed = parseDateOnly(dateValue);
    return parsed ? parsed.format('YYYY-MM') : null;
  };

  const getYearLabel = (dateValue) => {
    if (!dateValue) {
      return null;
    }
    const parsed = parseDateOnly(dateValue);
    return parsed ? parsed.format('YYYY') : null;
  };

  useEffect(() => {
    const loadDeals = async () => {
      setLoadingDeals(true);
      try {
        const data = await fetchDeals();
        setDeals(data.deals || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingDeals(false);
      }
    };
    loadDeals();
    const loadLeads = async () => {
      setLoadingLeads(true);
      try {
        const data = await fetchLeads();
        setLeads(data.leads || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingLeads(false);
      }
    };
    const loadActivityLogs = async () => {
      setLoadingActivityLogs(true);
      try {
        const data = await fetchActivityLogs();
        setActivityLogs(data.logs || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingActivityLogs(false);
      }
    };
    const loadLookupValues = async () => {
      setLoadingLookupValues(true);
      try {
        const data = await fetchLookupValues();
        setLookupValues(data.values || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingLookupValues(false);
      }
    };
    const loadGoals = async () => {
      setLoadingGoals(true);
      try {
        const data = await fetchGoals();
        setGoals(data.goals || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingGoals(false);
      }
    };
    loadLookupValues();
    loadGoals();
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
    if (summaryPeriodMode === 'year') {
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
  }, [monthlyDeals, summaryPeriodMode, deals]);

  const monthlyLabels = monthlyData.map((item) => (summaryPeriodMode === 'year' ? item.year : item.month));

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
    const now = dayjs();
    const currentYear = Number(now.year());
    const currentMonth = now.format('YYYY-MM');
    const prevYear = String(currentYear - 1);
    const prevMonth = now.subtract(1, 'month').format('YYYY-MM');

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

  const currentPeriodKeys = useMemo(() => {
    const now = dayjs();
    const year = now.format('YYYY');
    const month = now.format('MM');
    return {
      yearStart: `${year}-01-01`,
      monthStart: `${year}-${month}-01`
    };
  }, []);

  const goalMap = useMemo(() => {
    return goals.reduce((acc, goal) => {
      if (!goal.period_type || !goal.period_start) {
        return acc;
      }
      const key = `${goal.period_type}:${String(goal.period_start).slice(0, 10)}`;
      acc[key] = Number(goal.amount) || 0;
      return acc;
    }, {});
  }, [goals]);

  const yearGoal = goalMap[`year:${currentPeriodKeys.yearStart}`] ?? null;
  const monthGoal = goalMap[`month:${currentPeriodKeys.monthStart}`] ?? null;

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
      goalValue: yearGoal,
      goalType: 'year',
      goalRate: yearGoal ? (overviewRaw.yearWon / yearGoal) * 100 : null,
      delta: overviewRaw.formatDelta(overviewRaw.yearDelta),
      deltaParts: overviewRaw.formatDeltaParts(overviewRaw.yearDelta, '전년'),
      deltaValue: overviewRaw.yearDelta,
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
      goalValue: monthGoal,
      goalType: 'month',
      goalRate: monthGoal ? (overviewRaw.monthWon / monthGoal) * 100 : null,
      delta: overviewRaw.formatDelta(overviewRaw.monthDelta),
      deltaParts: overviewRaw.formatDeltaParts(overviewRaw.monthDelta, '전월'),
      deltaValue: overviewRaw.monthDelta,
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
        const aTime = dayjs(a.created_at || a.updated_at || 0).valueOf();
        const bTime = dayjs(b.created_at || b.updated_at || 0).valueOf();
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
      const key = summaryPeriodMode === 'year' ? getYearLabel(lead.created_at) : getMonthLabel(lead.created_at);
      addCount(leadMap, key);
    });

    deals.forEach((deal) => {
      if (deal.deleted_at || deal.deletedAt) {
        return;
      }
      const key = summaryPeriodMode === 'year' ? getYearLabel(deal.created_at) : getMonthLabel(deal.created_at);
      addCount(dealMap, key);
      if (getStatus(deal) === '수주') {
        const wonKey =
          summaryPeriodMode === 'year' ? getYearLabel(deal.won_date) : getMonthLabel(deal.won_date);
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
  }, [leads, deals, summaryPeriodMode]);

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
    const now = dayjs();
    const currentYear = now.format('YYYY');
    const currentMonth = now.format('YYYY-MM');
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
    const now = dayjs();
    const currentYear = now.year();
    const currentMonth = now.format('YYYY-MM');
    const prevYear = String(currentYear - 1);
    const prevMonth = now.subtract(1, 'month').format('YYYY-MM');

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
        const leadDate = dayjs(lead.created_at);
        const dealDate = dayjs(deal.created_at);
        if (!leadDate.isValid() || !dealDate.isValid()) {
          return null;
        }
        return Math.max(0, Math.round(dealDate.diff(leadDate, 'day', true)));
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
    const base = normalizeDateForCompare(dayjs());
    const toDays = (value) => {
      if (!value) return null;
      const date = parseDateOnly(value);
      if (!date) return null;
      return Math.ceil(date.diff(base, 'day', true));
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
      await updateDeal(editingDeal.id, payload);
      const refreshedData = await fetchDeals();
      setDeals(refreshedData.deals || []);
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
      await deleteDeal(editingDeal.id);
      const refreshedData = await fetchDeals();
      setDeals(refreshedData.deals || []);
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
      id: 'pipeline-chart',
      type: 'bar',
      toolbar: { show: false },
      width: '100%'
    },
    colors: pipelineColors,
    stroke: { colors: ['transparent'] },
    dataLabels: {
      enabled: false
    },
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
        show: true,
        offsetX: 0,
        minWidth: 110,
        maxWidth: 140,
        style: { colors: theme === 'dark' ? '#e2e8f0' : '#64748b' }
      }
    },
    grid: {
      padding: {
        left: 12,
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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const frame = window.requestAnimationFrame(() => {
      ApexCharts.exec('pipeline-chart', 'updateOptions', pipelineOptions, false, true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pipelineOptions]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const frame = window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [monthlySeries, pipelineSeries, statusTrend.series, summaryMonthlySeries, summaryStatusTrend.series, theme]);

  const openGoalModal = (tab = goalTab) => {
    setGoalTab(tab);
    setIsGoalModalOpen(true);
  };

  const openGoalFormModal = () => {
    const defaultPeriod =
      goalTab === 'year' ? currentPeriodKeys.yearStart.slice(0, 4) : currentPeriodKeys.monthStart.slice(0, 7);
    setGoalFormInput({ period: defaultPeriod, amount: '' });
    setGoalFormMode('create');
    setIsGoalFormOpen(true);
  };

  const openGoalEditModal = (goal) => {
    const periodStart = goal?.period_start ? String(goal.period_start).slice(0, 10) : '';
    const period = goal?.period_type === 'year' ? periodStart.slice(0, 4) : periodStart.slice(0, 7);
    setGoalTab(goal?.period_type || 'year');
    const rawAmount = goal?.amount ?? '';
    const formattedAmount = rawAmount === '' || rawAmount === null ? '' : Number(rawAmount).toLocaleString('ko-KR');
    setGoalFormInput({ period, amount: formattedAmount });
    setGoalFormMode('edit');
    setIsGoalFormOpen(true);
  };

  const handleGoalFormChange = (field) => (event) => {
    const raw = event.target.value || '';
    let next = raw;
    if (field === 'period') {
      if (goalTab === 'year') {
        next = raw.replace(/[^\d]/g, '').slice(0, 4);
      } else {
        const digits = raw.replace(/[^\d]/g, '');
        if (digits.length <= 4) {
          next = digits;
        } else {
          next = `${digits.slice(0, 4)}-${digits.slice(4, 6)}`;
        }
        next = next.slice(0, 7);
      }
    } else {
      const digits = raw.replace(/[^\d]/g, '');
      next = digits ? Number(digits).toLocaleString('ko-KR') : '';
    }
    setGoalFormInput((prev) => ({ ...prev, [field]: next }));
  };

  const saveGoalForm = async () => {
    try {
      if (!goalFormInput.period || !goalFormInput.amount) {
        showToast('기간과 금액을 입력하세요.', 'error');
        return;
      }
      if (goalTab === 'year' && goalFormInput.period.length !== 4) {
        showToast('연도는 4자리로 입력하세요.', 'error');
        return;
      }
      if (goalTab === 'month' && !/^\d{4}-\d{2}$/.test(goalFormInput.period)) {
        showToast('연도-월 형식(YYYY-MM)으로 입력하세요.', 'error');
        return;
      }
      const payload = {
        period_type: goalTab,
        period_start: goalTab === 'year' ? `${goalFormInput.period}-01-01` : `${goalFormInput.period}-01`,
        amount: goalFormInput.amount.replace(/[^\d]/g, '')
      };
      await upsertGoal(payload);
      const refreshedData = await fetchGoals();
      setGoals(refreshedData.goals || []);
      setGoalFormMode('create');
      setIsGoalFormOpen(false);
      showToast('목표가 저장되었습니다.', 'success');
    } catch (error) {
      console.error(error);
      showToast('목표 저장에 실패했습니다.', 'error');
    }
  };

  const deleteGoal = async (id) => {
    try {
      await deleteGoal(id);
      const refreshedData = await fetchGoals();
      setGoals(refreshedData.goals || []);
      showToast('삭제되었습니다.', 'success');
    } catch (error) {
      console.error(error);
      showToast('삭제에 실패했습니다.', 'error');
    }
  };

  const goalRows = useMemo(() => {
    return goals
      .filter((goal) => goal.period_type === goalTab)
      .sort((a, b) => String(b.period_start).localeCompare(String(a.period_start)));
  }, [goals, goalTab]);

  const formatGoalPeriod = (goal) => {
    if (!goal?.period_start) {
      return '-';
    }
    const text = String(goal.period_start).slice(0, 10);
    if (goal.period_type === 'year') {
      return text.slice(0, 4);
    }
    return text.slice(0, 7);
  };

  return (
    <>
      <section className="content__section content__section--single">
        <div className="dashboard">
          <div className="dashboard__overview">
            {loadingDeals || loadingGoals || loadingLookupValues ? (
              <Loading />
            ) : (
              <div className="dashboard__overview-cards dashboard__overview-cards--hero">
                {overviewStats.map((item) => (
                  <div className="dashboard__overview-card dashboard__overview-card--hero" key={item.label}>
                    {item.goalType && (
                      <button
                        type="button"
                        className="dashboard__overview-edit"
                        onClick={() => openGoalModal(item.goalType)}
                        data-tooltip="목표 금액 수정"
                        aria-label={`${item.label} 목표 설정`}
                      >
                        <img src={penLineIcon} alt="" />
                      </button>
                    )}
                    <div className="dashboard__overview-content">
                      <span className="dashboard__overview-label">{item.label}</span>
                      <strong className="dashboard__overview-value">
                        {item.value}
                        {item.label.includes('수주액') && <span className="dashboard__overview-unit">원</span>}
                        {item.unit && item.value !== '-' && <span className="dashboard__overview-unit">{item.unit}</span>}
                        {item.deltaValue !== undefined && item.deltaValue !== null && (
                          <span
                            className={`dashboard__overview-delta-inline ${item.deltaClass || ''}`}
                            data-tooltip={item.deltaTooltip || ''}
                          >
                            ({Math.abs(item.deltaValue).toFixed(1)}% {item.deltaValue >= 0 ? '↑' : '↓'})
                          </span>
                        )}
                      </strong>
                      {item.goalType && (
                        <button type="button" className="dashboard__overview-goal" onClick={() => openGoalModal(item.goalType)}>
                          목표 {item.goalValue === null ? '-' : formatAmount(item.goalValue)}
                         
                            {item.goalRate === null || item.goalRate === undefined
                              ? ''
                              : ` (${item.goalRate.toFixed(1)}%)`}
                         
                        </button>
                      )}
                      {/* {item.delta && item.deltaValue === null && (
                        <em className="dashboard__overview-delta">
                          {item.deltaParts?.prefix === '-' ? '-' : item.deltaParts?.prefix || ''}
                          <span className={`dashboard__overview-delta-text ${item.deltaClass || ''}`}>
                            {item.deltaParts?.prefix === '-' ? '' : item.deltaParts?.trend || item.delta}
                          </span>
                          {item.deltaParts?.prefix === '-' ? '' : item.deltaParts?.suffix || ''}
                        </em>
                      )} */}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="dashboard__triple-section">
            <div className="dashboard__triple-header">
              <div />
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
            <div className="dashboard__triple-row">
              <div className="dashboard__section">
                <div className="dashboard__section-header">
                  <div className="dashboard__section-title">수주액</div>
                </div>
              <div className="dashboard__chart">
                <div className="dashboard__chart-canvas">
                  {loadingDeals ? (
                    <Loading />
                  ) : monthlyData.length === 0 ? (
                    <p className="table__status table__status--centered">데이터가 없습니다.</p>
                  ) : (
                    <ReactApexChart options={monthlyOptions} series={monthlySeries} type="line" height={220} />
                  )}
                </div>
              </div>
              </div>
              <div className="dashboard__section">
                <div className="dashboard__section-header">
                  <div className="dashboard__section-title">PipeLine Analysis</div>
                </div>
                <div className="dashboard__pipeline">
                  <div className="dashboard__pipeline-visual dashboard__pipeline-chart">
                    {loadingDeals || loadingLookupValues ? (
                      <Loading />
                    ) : pipelineSeries[0]?.data?.every((value) => !value) ? (
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
              </div>
              <div className="dashboard__section">
                <div className="dashboard__section-header">
                  <div className="dashboard__section-title">상태별 건수</div>
                </div>
                <div className="dashboard__pipeline-stats">
                  <div className="dashboard__pipeline-stats-chart">
                    {loadingDeals || loadingLeads ? (
                      <Loading />
                    ) : statusTrend.categories.length === 0 ? (
                      <p className="table__status table__status--centered">데이터가 없습니다.</p>
                    ) : (
                    <ReactApexChart options={pipelineStatusOptions} series={statusTrend.series} type="bar" height={220} />
                    )}
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
              <div className="dashboard__table dashboard__table--scroll dashboard__table--summary">
                {loadingDeals || loadingLeads || loadingLookupValues ? (
                  <Loading />
                ) : (
                  <div className="table__wrapper">
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
                )}
              </div>
            </div>
            <div className="dashboard__section">
              <div className="dashboard__section-header">
                <div className="dashboard__section-title">진행중인 딜</div>
                <div className="dashboard__section-spacer" />
              </div>
              <div className="dashboard__table dashboard__table--scroll">
                {loadingDeals || loadingLookupValues ? (
                  <Loading />
                ) : (
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
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      <SummaryModal
        isOpen={isSummaryModalOpen}
        departmentOptions={departmentOptions}
        ownerOptions={ownerOptions}
        summaryDepartment={summaryDepartment}
        summaryOwner={summaryOwner}
        summaryTopCards={summaryTopCards}
        periodMode={periodMode}
        summaryMonthlyData={summaryMonthlyData}
        summaryMonthlyOptions={summaryMonthlyOptions}
        summaryMonthlySeries={summaryMonthlySeries}
        summaryStatusOptions={summaryStatusOptions}
        summaryStatusTrend={summaryStatusTrend}
        summaryUpcomingDeals={summaryUpcomingDeals}
        summaryLossReasons={summaryLossReasons}
        summaryLossTotal={summaryLossTotal}
        setSummaryDepartment={setSummaryDepartment}
        setSummaryOwner={setSummaryOwner}
        setPeriodMode={setPeriodMode}
        openEditModal={openEditModal}
        closeModal={() => setIsSummaryModalOpen(false)}
        formatDate={formatDate}
      />

      <GoalModal
        isOpen={isGoalModalOpen}
        goalTab={goalTab}
        goalRows={goalRows}
        trashIcon={trashIcon}
        setGoalTab={setGoalTab}
        openGoalFormModal={openGoalFormModal}
        openGoalEditModal={openGoalEditModal}
        deleteGoal={deleteGoal}
        formatGoalPeriod={formatGoalPeriod}
        formatAmount={formatAmount}
        closeModal={() => setIsGoalModalOpen(false)}
      />

      <GoalFormModal
        isOpen={isGoalFormOpen}
        goalTab={goalTab}
        goalFormInput={goalFormInput}
        handleGoalFormChange={handleGoalFormChange}
        saveGoalForm={saveGoalForm}
        closeModal={() => setIsGoalFormOpen(false)}
      />

      <DealEditModal
        isOpen={isDealModalOpen}
        editingDeal={editingDeal}
        modalSizeClass={modalSizeClass}
        modalLayoutClass={modalLayoutClass}
        showLeadPanel={showLeadPanel}
        showLogPanel={showLogPanel}
        leadModalFields={leadModalFields}
        dealLeadInfo={dealLeadInfo}
        dealFields={dealFields}
        formData={formData}
        formStatus={formStatus}
        dealLogs={dealLogs}
        handleChange={handleChange}
        submitDeal={submitDeal}
        handleDelete={handleDelete}
        applyLogToForm={applyLogToForm}
        closeModal={() => setIsDealModalOpen(false)}
        formatDate={formatDate}
        formatAmount={formatAmount}
      />
      <ConfirmDialog
        open={confirmState.open}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm || (() => setConfirmState({ open: false, message: '', onConfirm: null }))}
        onCancel={() => setConfirmState({ open: false, message: '', onConfirm: null })}
      />
      <Toast message={toastMessage} variant={toastType} />
    </>
  );
}

export default DashboardPage;
