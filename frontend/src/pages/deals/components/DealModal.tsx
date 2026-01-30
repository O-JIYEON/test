import { useEffect, useMemo, useRef } from 'react';
import IconButton from '../../../components/common/IconButton';
import xIcon from '../../../assets/icon/x.svg';

type DealModalProps = {
  isOpen: boolean;
  editingId: string | number | null;
  formData: Record<string, any>;
  modalSizeClass: string;
  modalLayoutClass: string;
  showLeadPanel: boolean;
  showLogPanel: boolean;
  dealLeadInfo: any;
  leadModalLeftFields: Array<any>;
  dealFields: Array<any>;
  leads: Array<any>;
  dealLogs: Array<any>;
  formStatus: string;
  errorMessage: string | null;
  closeModal: () => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  handleChange: (name: string, value: any) => void;
  handleDelete: () => void;
  applyLogToForm: (log: any) => void;
  formatDate: (value: any) => string;
  formatDateTime: (value: any) => string;
  formatAmount: (value: any) => string;
};

function DealModal({
  isOpen,
  editingId,
  formData,
  modalSizeClass,
  modalLayoutClass,
  showLeadPanel,
  showLogPanel,
  dealLeadInfo,
  leadModalLeftFields,
  dealFields,
  leads,
  dealLogs,
  formStatus,
  errorMessage,
  closeModal,
  handleSubmit,
  handleChange,
  handleDelete,
  applyLogToForm,
  formatDate,
  formatDateTime,
  formatAmount
}: DealModalProps) {
  if (!isOpen) {
    return null;
  }

  const logFields = useMemo(
    () => [
      { key: 'project_name', label: '프로젝트명', format: (value: any) => value || '-' },
      { key: 'manager', label: '담당자', format: (value: any) => value || '-' },
      { key: 'sales_owner', label: '담당자(영업)', format: (value: any) => value || '-' },
      { key: 'deal_stage', label: '딜단계', format: (value: any) => value || '-' },
      {
        key: 'expected_amount',
        label: '예상금액',
        format: (value: any) => formatAmount(value) || '-'
      },
      {
        key: 'next_action_date',
        label: '다음액션일',
        format: (value: any) => formatDate(value) || '-'
      },
      {
        key: 'next_action_content',
        label: '다음액션내용',
        format: (value: any) => value || '-'
      }
    ],
    [formatAmount, formatDate]
  );

  const groupedLogs = useMemo(() => {
    const groups: Array<{
      date: string;
      items: Array<{
        id: number | string;
        time: string;
        isFirst: boolean;
        changes: Array<{ key: string; label: string; value: string }>;
      }>;
    }> = [];
    const groupMap = new Map<string, (typeof groups)[number]>();
    let previousValues: Record<string, string> | null = null;

    dealLogs.forEach((log, index) => {
      const dateLabel = formatDate(log.activity_date) || '';
      const dateTimeLabel = formatDateTime(log.activity_date) || '';
      const timeLabel = dateTimeLabel.split(' ')[1] || dateTimeLabel;
      const currentValues = logFields.map((field) => ({
        key: field.key,
        label: field.label,
        value: field.format(log[field.key])
      }));

      const changes =
        index === 0 || !previousValues
          ? currentValues
          : currentValues.filter((field) => previousValues?.[field.key] !== field.value);

      if (!groupMap.has(dateLabel)) {
        const group = { date: dateLabel, items: [] };
        groupMap.set(dateLabel, group);
        groups.push(group);
      }

      if (changes.length > 0) {
        groupMap.get(dateLabel)?.items.push({
          id: log.id,
          time: timeLabel,
          isFirst: index === 0,
          changes
        });
      }

      previousValues = currentValues.reduce<Record<string, string>>((acc, field) => {
        acc[field.key] = field.value;
        return acc;
      }, {});
    });

    return groups.filter((group) => group.items.length > 0);
  }, [dealLogs, formatDate, formatDateTime, logFields]);

  const logsListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showLogPanel) {
      return;
    }
    const target = logsListRef.current;
    if (!target) {
      return;
    }
    requestAnimationFrame(() => {
      target.scrollTop = target.scrollHeight;
    });
  }, [showLogPanel, dealLogs.length, isOpen]);

  return (
    <div className="modal">
      <div className="modal__overlay" onClick={closeModal} />
      <div
        className={`modal__content modal__content--white deal-modal__content ${modalSizeClass}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal__header">
          <div className="modal__title-row modal__title-row--spaced">
            <h3>{editingId ? formData.deal_code || editingId : '딜 등록'}</h3>
            <IconButton onClick={closeModal} aria-label="닫기">
              <img src={xIcon} alt="" aria-hidden="true" />
            </IconButton>
          </div>
        </div>
        <form className="project-form" onSubmit={handleSubmit}>
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
            <div className="deal-modal__form">
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
              if (field.name === 'won_date' && stageValue !== '수주') {
                return null;
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
                      rows={4}
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
                                    return field.options?.map((option: string) => (
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
            {errorMessage && null}
            </div>
          {showLogPanel && (
            <div className="deal-modal__logs">
            
              {dealLogs.length === 0 ? (
                <p className="table__status">기록이 없습니다.</p>
              ) : (
                <div className="deal-modal__logs-list" ref={logsListRef}>
                  {groupedLogs.map((group) => (
                    <div className="deal-modal__log-group" key={group.date}>
                      <div className="deal-modal__log-date-label">{group.date}</div>
                      <div className="deal-modal__log-group-body">
                        {group.items.map((entry) => (
                          <div
                            className="deal-modal__log-entry"
                            key={entry.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              const targetLog = dealLogs.find((log) => String(log.id) === String(entry.id));
                              if (targetLog) {
                                applyLogToForm(targetLog);
                              }
                            }}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                const targetLog = dealLogs.find((log) => String(log.id) === String(entry.id));
                                if (targetLog) {
                                  applyLogToForm(targetLog);
                                }
                              }
                            }}
                          >
                            <div className="deal-modal__log-time">
                              {entry.time}
                              {entry.isFirst ? ' (딜 생성)' : ''}
                            </div>
                            <div className="deal-modal__log-lines">
                              {entry.changes.length > 0 &&
                                entry.changes.map((field) => (
                                  <div className="deal-modal__log-line" key={field.key}>
                                    <span className="deal-modal__log-line-label">{field.label}</span>
                                    <span className="deal-modal__log-line-value">{field.value}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          </div>
          <div className="modal__footer">
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
          </div>
        </form>
      </div>
    </div>
  );
}

export default DealModal;
