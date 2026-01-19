import { useEffect, useMemo, useRef, useState } from 'react';
import ConfirmDialog from '../../components/ConfirmDialog';

const projectFields = [
  { name: 'name', label: '프로젝트명', type: 'text' },
  { name: 'start_date', label: '시작일', type: 'date' },
  { name: 'end_date', label: '종료일', type: 'date' },
  { name: 'description', label: '설명', type: 'textarea' },
  { name: 'owner', label: '담당자', type: 'text' },
  {
    name: 'source',
    label: '유입경로',
    type: 'select',
    options: ['inbound', 'outbound', 'referral', 'event', 'marketing']
  },
  { name: 'company', label: '회사명', type: 'text' },
  { name: 'amount', label: '금액', type: 'number' }
];

const projectColumns = [
  { key: 'id', label: 'id' },
  { key: 'name', label: '프로젝트명' },
  { key: 'start_date', label: '시작일' },
  { key: 'end_date', label: '종료일' },
  { key: 'description', label: '설명' },
  { key: 'owner', label: '담당자' },
  { key: 'source', label: '소스' },
  { key: 'company', label: '회사명' },
  { key: 'amount', label: '금액' },
];

const formatDate = (value) => {
  if (!value) {
    return '';
  }
  const text = String(value);
  return text.length >= 10 ? text.slice(0, 10) : text;
};

const normalizeDateInput = (value) => formatDate(value);

const parseDate = (value) => {
  if (!value) {
    return null;
  }
  const normalized = formatDate(value);
  const date = new Date(`${normalized}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const buildTimeline = (items) => {
  const projects = items
    .map((project) => {
      const start = parseDate(project.start_date);
      const end = parseDate(project.end_date);
      if (!start || !end) {
        return null;
      }
      return {
        ...project,
        start,
        end
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.start - b.start);

  if (projects.length === 0) {
    return null;
  }

  const minStart = new Date(projects[0].start.getFullYear(), projects[0].start.getMonth(), 1);
  const maxEnd = projects.reduce((latest, project) => {
    const monthEnd = new Date(project.end.getFullYear(), project.end.getMonth(), 1);
    return monthEnd > latest ? monthEnd : latest;
  }, minStart);

  const months = [];
  const cursor = new Date(minStart);
  while (cursor <= maxEnd) {
    months.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const monthIndex = (date) =>
    (date.getFullYear() - minStart.getFullYear()) * 12 + (date.getMonth() - minStart.getMonth());

  const lanes = [];
  const placements = projects.map((project) => {
    const startIndex = monthIndex(project.start);
    const endIndex = monthIndex(project.end);
    const today = new Date();
    const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
    const isPast = project.end < normalizedToday;
    const isFuture = project.start > normalizedToday;
    const isActive = !isPast && !isFuture;
    const startDaysInMonth = new Date(project.start.getFullYear(), project.start.getMonth() + 1, 0).getDate();
    const endDaysInMonth = new Date(project.end.getFullYear(), project.end.getMonth() + 1, 0).getDate();
    const startDayFraction = (project.start.getDate() - 1) / startDaysInMonth;
    const endDayFraction = project.end.getDate() / endDaysInMonth;
    let laneIndex = lanes.findIndex((lane) => lane[lane.length - 1].endIndex < startIndex);
    if (laneIndex === -1) {
      laneIndex = lanes.length;
      lanes.push([]);
    }
    lanes[laneIndex].push({ ...project, startIndex, endIndex, isPast });
    return {
      ...project,
      startIndex,
      endIndex,
      startDayFraction,
      endDayFraction,
      laneIndex,
      isPast,
      isFuture,
      isActive
    };
  });

  const years = months.reduce((acc, month) => {
    const year = month.getFullYear();
    const last = acc[acc.length - 1];
    if (!last || last.year !== year) {
      acc.push({ year, count: 1 });
    } else {
      last.count += 1;
    }
    return acc;
  }, []);

  const todayOffset = (() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
    const monthOffset = months.findIndex(
      (month) => month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth()
    );
    if (monthOffset < 0) {
      return null;
    }
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const dayFraction = (today.getDate() - 1) / daysInMonth;
    return { monthOffset, dayFraction };
  })();

  return {
    months,
    years,
    placements,
    laneCount: lanes.length,
    todayOffset
  };
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

function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [status, setStatus] = useState('loading');
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [formStatus, setFormStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [sortState, setSortState] = useState({ key: null, direction: null });
  const [confirmState, setConfirmState] = useState({
    open: false,
    message: '',
    onConfirm: null
  });
  const [hoveredProjectId, setHoveredProjectId] = useState(null);
  const [includeCompleted, setIncludeCompleted] = useState(false);
  const [summaryDisplay, setSummaryDisplay] = useState({
    total: 0,
    planned: 0,
    inProgress: 0,
    completed: 0
  });
  const summaryDisplayRef = useRef({
    total: 0,
    planned: 0,
    inProgress: 0,
    completed: 0
  });
  const pageSize = 10;

  const loadProjects = async () => {
    try {
      setStatus('loading');
      const response = await fetch('http://localhost:3001/api/projects');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch projects');
      }
      setProjects(data.projects || []);
      setStatus('ready');
      setPage(1);
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({});
    setFormStatus('');
    setIsModalOpen(true);
  };

  const openEditModal = (project) => {
    setEditingId(project.id);
    const nextData = projectFields.reduce((acc, field) => {
      const rawValue = project[field.name] ?? '';
      acc[field.name] = field.type === 'date' ? normalizeDateInput(rawValue) : rawValue;
      return acc;
    }, {});
    setFormData(nextData);
    setFormStatus('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const submitProject = async () => {
    setFormStatus('saving');
    try {
      const payload = { ...formData };
      projectFields.forEach((field) => {
        if (field.type === 'date' && payload[field.name]) {
          payload[field.name] = normalizeDateInput(payload[field.name]);
        }
      });
      if (payload.amount !== undefined) {
        payload.amount = String(payload.amount).replace(/,/g, '');
      }
      const response = await fetch(
        editingId ? `http://localhost:3001/api/projects/${editingId}` : 'http://localhost:3001/api/projects',
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save project');
      }
      await loadProjects();
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({});
      setFormStatus('');
    } catch (error) {
      console.error(error);
      setFormStatus('error');
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setConfirmState({
      open: true,
      message: editingId ? '프로젝트 정보를 수정하시겠습니까?' : '프로젝트를 등록하시겠습니까?',
      onConfirm: () => {
        submitProject();
        setConfirmState({ open: false, message: '', onConfirm: null });
      }
    });
  };

  const deleteProject = async (project) => {
    try {
      const response = await fetch(`http://localhost:3001/api/projects/${project.id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete project');
      }
      await loadProjects();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = (project) => {
    if (!project.id) {
      return;
    }
    setConfirmState({
      open: true,
      message: '프로젝트를 삭제하시겠습니까?',
      onConfirm: () => {
        deleteProject(project);
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

  const sortedProjects = (() => {
    if (!sortState.key || !sortState.direction) {
      return projects;
    }
    const sorted = [...projects];
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
      return String(leftValue).localeCompare(String(rightValue), 'ko-KR', {
        numeric: true,
        sensitivity: 'base'
      }) * directionFactor;
    });
    return sorted;
  })();

  const filteredProjects = includeCompleted
    ? sortedProjects
    : sortedProjects.filter((project) => {
        if (!project.start_date || !project.end_date) {
          return false;
        }
        const start = parseDate(project.start_date);
        const end = parseDate(project.end_date);
        if (!start || !end) {
          return false;
        }
        const today = new Date();
        const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
        return end >= normalizedToday;
      });
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const pageStart = (clampedPage - 1) * pageSize;
  const visibleProjects = filteredProjects.slice(pageStart, pageStart + pageSize);
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const summary = useMemo(() => {
    const today = new Date();
    const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
    return projects.reduce(
      (acc, project) => {
        acc.total += 1;
        const start = parseDate(project.start_date);
        const end = parseDate(project.end_date);
        if (!start || !end) {
          return acc;
        }
        if (end < normalizedToday) {
          acc.completed += 1;
          return acc;
        }
        if (start > normalizedToday) {
          acc.planned += 1;
          return acc;
        }
        acc.inProgress += 1;
        return acc;
      },
      { total: 0, planned: 0, inProgress: 0, completed: 0 }
    );
  }, [projects]);
  const [timelineMode, setTimelineMode] = useState('page');
  const timelineProjects = timelineMode === 'all' ? projects : visibleProjects;
  const timeline = useMemo(() => buildTimeline(timelineProjects), [timelineProjects]);
  const [timelineCell, setTimelineCell] = useState(72);
  const timelineGap = 4;
  const timelineScrollRef = useRef(null);
  const timelineAutoScrollRef = useRef(false);
  const useFixedTimeline = timeline ? timeline.months.length > 18 : false;
  const isFluidTimeline = timeline ? timeline.months.length <= 18 : false;

  useEffect(() => {
    if (!timeline || !useFixedTimeline || !timeline.todayOffset || timelineAutoScrollRef.current) {
      return;
    }
    const container = timelineScrollRef.current;
    if (!container) {
      return;
    }
    const linePosition =
      timeline.todayOffset.monthOffset * (timelineCell + timelineGap) +
      timeline.todayOffset.dayFraction * timelineCell;
    const targetScroll = Math.max(0, linePosition - container.clientWidth / 2);
    container.scrollLeft = targetScroll;
    timelineAutoScrollRef.current = true;
  }, [timeline, useFixedTimeline, timelineCell, timelineGap]);

  useEffect(() => {
    if (!timeline || !useFixedTimeline) {
      return;
    }
    const container = timelineScrollRef.current;
    if (!container || typeof ResizeObserver === 'undefined') {
      return;
    }
    const updateCellWidth = () => {
      const width = container.clientWidth || 1;
      setTimelineCell(width / 18);
    };
    updateCellWidth();
    const observer = new ResizeObserver(updateCellWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, [timeline, useFixedTimeline]);

  useEffect(() => {
    timelineAutoScrollRef.current = false;
  }, [timelineMode, projects.length]);

  useEffect(() => {
    const duration = 300;
    const start = performance.now();
    const from = summaryDisplayRef.current;
    let frame = 0;
    const step = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const next = {
        total: Math.round(from.total + (summary.total - from.total) * progress),
        planned: Math.round(from.planned + (summary.planned - from.planned) * progress),
        inProgress: Math.round(from.inProgress + (summary.inProgress - from.inProgress) * progress),
        completed: Math.round(from.completed + (summary.completed - from.completed) * progress)
      };
      summaryDisplayRef.current = next;
      setSummaryDisplay(next);
      if (progress < 1) {
        frame = requestAnimationFrame(step);
      }
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [summary]);

  return (
    <>
      <header className="content__header">
        <div className="content__header-row">
          <h2>프로젝트 관리</h2>
          <div className="header-actions">
            <label className="toggle-check">
              <input
                type="checkbox"
                checked={includeCompleted}
                onChange={(event) => {
                  setIncludeCompleted(event.target.checked);
                  setPage(1);
                }}
              />
              <span>완료 프로젝트 포함</span>
            </label>
            <button className="project-form__submit" type="button" onClick={openCreateModal}>
              프로젝트 등록
            </button>
          </div>
        </div>
      </header>
      <section className="content__section content__section--single">
        <div className="content__card content__card--wide">
          <div className="summary">
            <div className="summary__item">
              <span className="summary__label">총 프로젝트</span>
              <span className="summary__value">{summaryDisplay.total}</span>
            </div>
            <div className="summary__item">
              <span className="summary__label">예정</span>
              <span className="summary__value">{summaryDisplay.planned}</span>
            </div>
            <div className="summary__item">
              <span className="summary__label">진행</span>
              <span className="summary__value">{summaryDisplay.inProgress}</span>
            </div>
            <div className="summary__item">
              <span className="summary__label">완료</span>
              <span className="summary__value">{summaryDisplay.completed}</span>
            </div>
          </div>
        </div>
        <div className="content__card content__card--wide">
          <div className="card-header">
              <h3>프로젝트 기간</h3>
              <div className="timeline-controls">
                <div className="timeline-legend">
                  <span className="timeline-legend__item">
                    <span className="timeline-legend__swatch timeline-legend__swatch--past" />
                    종료
                  </span>
                  <span className="timeline-legend__item">
                    <span className="timeline-legend__swatch timeline-legend__swatch--active" />
                    진행중
                  </span>
                  <span className="timeline-legend__item">
                    <span className="timeline-legend__swatch timeline-legend__swatch--future" />
                    예정
                  </span>
                </div>
                <div className="toggle-group">
                  <button
                    className={`toggle-button${timelineMode === 'page' ? ' toggle-button--active' : ''}`}
                    type="button"
                    onClick={() => setTimelineMode('page')}
                  >
                    현재 페이지
                  </button>
                  <button
                    className={`toggle-button${timelineMode === 'all' ? ' toggle-button--active' : ''}`}
                    type="button"
                    onClick={() => setTimelineMode('all')}
                  >
                    전체 보기
                  </button>
                </div>
              </div>
            </div>
          {timeline ? (
            <div
              className="timeline"
              style={{
                '--timeline-cell': `${timelineCell}px`,
                '--timeline-gap': `${isFluidTimeline ? 0 : timelineGap}px`
              }}
            >
              <div className="timeline__scroll" ref={timelineScrollRef}>
                <div
                  className={`timeline__canvas${isFluidTimeline ? ' timeline__canvas--fluid' : ''}`}
                  style={{
                    width: useFixedTimeline
                      ? `${Math.round(timelineCell * timeline.months.length)}px`
                      : '100%'
                  }}
                >
                  {timeline.todayOffset && (
                    <div
                      className="timeline__today-line"
                      style={{
                        left: useFixedTimeline
                          ? `${timeline.todayOffset.monthOffset * (timelineCell + timelineGap) +
                            timeline.todayOffset.dayFraction * timelineCell}px`
                          : `${((timeline.todayOffset.monthOffset + timeline.todayOffset.dayFraction) /
                              timeline.months.length) *
                              100}%`
                      }}
                    />
                  )}
                  <div
                    className="timeline__years"
                    style={{
                      gridTemplateColumns: useFixedTimeline
                        ? `repeat(${timeline.months.length}, ${timelineCell}px)`
                        : `repeat(${timeline.months.length}, minmax(0, 1fr))`
                    }}
                  >
                    {timeline.years.map((year) => (
                      <div
                        key={year.year}
                        className="timeline__year"
                        style={{ gridColumn: `span ${year.count}` }}
                      >
                        {year.year}
                      </div>
                    ))}
                  </div>
                  <div
                    className="timeline__months"
                    style={{
                      gridTemplateColumns: useFixedTimeline
                        ? `repeat(${timeline.months.length}, ${timelineCell}px)`
                        : `repeat(${timeline.months.length}, minmax(0, 1fr))`
                    }}
                  >
                    {timeline.months.map((month) => (
                      <div key={month.toISOString()} className="timeline__month">
                        {String(month.getMonth() + 1).padStart(2, '0')}
                      </div>
                    ))}
                  </div>
                  <div className="timeline__body">
                    {Array.from({ length: timeline.laneCount }).map((_, laneIndex) => (
                      <div key={laneIndex} className="timeline__lane">
                        {timeline.placements
                          .filter((item) => item.laneIndex === laneIndex)
                          .map((item) => {
                            const startOffset = item.startIndex + item.startDayFraction;
                            const endOffset = item.endIndex + item.endDayFraction;
                            if (useFixedTimeline) {
                              const startPx =
                                item.startIndex * (timelineCell + timelineGap) +
                                item.startDayFraction * timelineCell;
                              const endPx =
                                item.endIndex * (timelineCell + timelineGap) +
                                item.endDayFraction * timelineCell;
                              const widthPx = Math.max(8, endPx - startPx);
                              return (
                                <div
                                  key={item.id}
                                  className={`timeline__bar${item.isPast ? ' timeline__bar--past' : ''}${
                                    item.isActive ? ' timeline__bar--active' : ''
                                  }${item.isFuture ? ' timeline__bar--future' : ''}${
                                    hoveredProjectId === item.id ? ' timeline__bar--highlight' : ''
                                  }`}
                                  style={{ left: `${startPx}px`, width: `${widthPx}px` }}
                                  data-tooltip={`${item.name} (${formatDate(item.start_date)} ~ ${formatDate(
                                    item.end_date
                                  )})`}
                                  onMouseEnter={() => setHoveredProjectId(item.id)}
                                  onMouseLeave={() => setHoveredProjectId(null)}
                                >
                                  <span className="timeline__bar-label">
                                    [{item.company ?? '-'}] {item.name}
                                  </span>
                                  {hoveredProjectId === item.id && (
                                    <span className="timeline__tooltip">
                                      {item.name} ({formatDate(item.start_date)} ~ {formatDate(item.end_date)})
                                    </span>
                                  )}
                                </div>
                              );
                            }
                            const startPercent = (startOffset / timeline.months.length) * 100;
                            const endPercent = (endOffset / timeline.months.length) * 100;
                            const widthPercent = Math.max(1, endPercent - startPercent);
                            return (
                              <div
                                key={item.id}
                                className={`timeline__bar${item.isPast ? ' timeline__bar--past' : ''}${
                                  item.isActive ? ' timeline__bar--active' : ''
                                }${item.isFuture ? ' timeline__bar--future' : ''}${
                                  hoveredProjectId === item.id ? ' timeline__bar--highlight' : ''
                                }`}
                                style={{ left: `${startPercent}%`, width: `${widthPercent}%` }}
                                data-tooltip={`${item.name} (${formatDate(item.start_date)} ~ ${formatDate(
                                  item.end_date
                                )})`}
                                onMouseEnter={() => setHoveredProjectId(item.id)}
                                onMouseLeave={() => setHoveredProjectId(null)}
                              >
                                <span className="timeline__bar-label">
                                  [{item.company ?? '-'}] {item.name}
                                </span>
                                {hoveredProjectId === item.id && (
                                  <span className="timeline__tooltip">
                                    {item.name} ({formatDate(item.start_date)} ~ {formatDate(item.end_date)})
                                  </span>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="table__status">기간 데이터가 없습니다.</p>
          )}
        </div>
        <div className="content__card content__card--wide">
          {status === 'loading' && <p className="table__status">불러오는 중...</p>}
          {status === 'error' && (
            <p className="table__status table__status--error">데이터를 불러오지 못했습니다.</p>
          )}
          {status === 'ready' && projects.length === 0 && (
            <p className="table__status">데이터가 없습니다.</p>
          )}
          {status === 'ready' && projects.length > 0 && (
            <div className="table__wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    {projectColumns.map((column) => (
                      <th key={column.key}>
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
                    <th>수정/삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleProjects.map((project) => (
                    <tr
                      key={project.id}
                      className={hoveredProjectId === project.id ? 'table-row--highlight' : ''}
                      onMouseEnter={() => setHoveredProjectId(project.id)}
                      onMouseLeave={() => setHoveredProjectId(null)}
                    >
                      {projectColumns.map((column) => {
                        if (column.key === 'start_date' || column.key === 'end_date') {
                          return <td key={column.key}>{formatDate(project[column.key])}</td>;
                        }
                        if (column.key === 'amount') {
                          return <td key={column.key}>{formatAmount(project[column.key])}</td>;
                        }
                        return <td key={column.key}>{project[column.key] ?? ''}</td>;
                      })}
                      <td>
                        <div className="table-actions">
                          <button
                            className="icon-button"
                            type="button"
                            aria-label="프로젝트 수정"
                            onClick={() => openEditModal(project)}
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M4 16.5V20h3.5L18.4 9.1l-3.5-3.5L4 16.5z" />
                              <path d="M19.7 7.8c.4-.4.4-1 0-1.4L17.6 4.3c-.4-.4-1-.4-1.4 0l-1.6 1.6 3.5 3.5 1.6-1.6z" />
                            </svg>
                          </button>
                          <button
                            className="icon-button icon-button--danger"
                            type="button"
                            aria-label="프로젝트 삭제"
                            onClick={() => handleDelete(project)}
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M6 7h12l-1 13H7L6 7z" />
                              <path d="M9 4h6l1 2H8l1-2z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {status === 'ready' && projects.length > pageSize && (
            <div className="pagination">
              <button
                className="icon-button"
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={clampedPage === 1}
              >
                이전
              </button>
              <div className="pagination__pages">
                {pages.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    className={`pagination__page${
                      pageNumber === clampedPage ? ' pagination__page--active' : ''
                    }`}
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
              >
                다음
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
              <h3>{editingId ? '프로젝트 수정' : '프로젝트 등록'}</h3>
              <button className="icon-button" type="button" onClick={closeModal} aria-label="닫기">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6.4 5l12.6 12.6-1.4 1.4L5 6.4 6.4 5z" />
                  <path d="M19 6.4 6.4 19l-1.4-1.4L17.6 5 19 6.4z" />
                </svg>
              </button>
            </div>
            <form className="project-form modal__body" onSubmit={handleSubmit}>
              {projectFields.map((field) => (
                <label className="project-form__field" htmlFor={`project-${field.name}`} key={field.name}>
                  {field.type === 'textarea' ? (
                    <textarea
                      id={`project-${field.name}`}
                      name={field.name}
                      rows="4"
                      placeholder=" "
                      value={formData[field.name] ?? ''}
                      onChange={(event) => handleChange(field.name, event.target.value)}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      id={`project-${field.name}`}
                      name={field.name}
                      value={formData[field.name] ?? ''}
                      data-filled={formData[field.name] ? 'true' : 'false'}
                      onChange={(event) => handleChange(field.name, event.target.value)}
                    >
                      <option value="" disabled hidden />
                      {field.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={`project-${field.name}`}
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
              <div className="form-actions">
                <button className="project-form__submit" type="submit" disabled={formStatus === 'saving'}>
                  {editingId ? '수정 저장' : '등록'}
                </button>
                <button className="form-actions__reset" type="button" onClick={closeModal}>
                  닫기
                </button>
              </div>
              {formStatus === 'error' && (
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

export default ProjectsPage;
