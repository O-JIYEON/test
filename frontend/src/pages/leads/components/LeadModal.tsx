import { useEffect, useMemo, useRef } from 'react';
import IconButton from '../../../components/common/IconButton';
import xIcon from '../../../assets/icon/x.svg';

type LeadModalProps = {
  isOpen: boolean;
  editingId: string | number | null;
  formData: Record<string, any>;
  customerQuery: string;
  contactQuery: string;
  customerListOpen: boolean;
  contactListOpen: boolean;
  filteredCustomers: Array<any>;
  filteredContacts: Array<any>;
  customerHighlightIndex: number;
  contactHighlightIndex: number;
  customerForm: Record<string, any>;
  contactForm: Record<string, any>;
  customerFields: Array<any>;
  contactDetailFields: Array<any>;
  leadFields: Array<any>;
  leadLogs: Array<any>;
  selectedLogId: string | number | null;
  formStatus: string;
  formatDate: (value: any) => string;
  formatDateTime: (value: any) => string;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  closeModal: () => void;
  setCustomerListOpen: (open: boolean) => void;
  setCustomerHighlightIndex: (value: number | ((prev: number) => number)) => void;
  setContactListOpen: (open: boolean) => void;
  setContactHighlightIndex: (value: number | ((prev: number) => number)) => void;
  handleCustomerInput: (value: string) => void;
  handleCustomerSelect: (customer: any) => void;
  handleContactInput: (value: string) => void;
  handleContactSelect: (contact: any) => void;
  handleChange: (name: string, value: any) => void;
  applyLogToForm: (log: any) => void;
  handleDelete: () => void;
};

function LeadModal({
  isOpen,
  editingId,
  formData,
  customerQuery,
  contactQuery,
  customerListOpen,
  contactListOpen,
  filteredCustomers,
  filteredContacts,
  customerHighlightIndex,
  contactHighlightIndex,
  customerForm,
  contactForm,
  customerFields,
  contactDetailFields,
  leadFields,
  leadLogs,
  selectedLogId,
  formStatus,
  formatDate,
  formatDateTime,
  handleSubmit,
  closeModal,
  setCustomerListOpen,
  setCustomerHighlightIndex,
  setContactListOpen,
  setContactHighlightIndex,
  handleCustomerInput,
  handleCustomerSelect,
  handleContactInput,
  handleContactSelect,
  handleChange,
  applyLogToForm,
  handleDelete
}: LeadModalProps) {
  if (!isOpen) {
    return null;
  }

  const showLogPanel = Boolean(editingId);
  const logsListRef = useRef<HTMLDivElement | null>(null);
  const logsPanelRef = useRef<HTMLDivElement | null>(null);
  const mainPanelRef = useRef<HTMLDivElement | null>(null);

  const logFields = useMemo(
    () => [
      { key: 'manager', label: '담당자', format: (value: any) => value || '-' },
      { key: 'sales_owner', label: '담당자(영업)', format: (value: any) => value || '-' },
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
    [formatDate]
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

    leadLogs.forEach((log, index) => {
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
  }, [leadLogs, formatDate, formatDateTime, logFields]);

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
  }, [showLogPanel, leadLogs.length, isOpen]);

  useEffect(() => {
    if (!showLogPanel) {
      return;
    }
    const mainPanel = mainPanelRef.current;
    const logsPanel = logsPanelRef.current;
    if (!mainPanel || !logsPanel) {
      return;
    }
    const updateHeight = () => {
      const nextHeight = mainPanel.offsetHeight;
      if (nextHeight) {
        logsPanel.style.maxHeight = `${nextHeight}px`;
      }
    };
    updateHeight();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateHeight);
      observer.observe(mainPanel);
      return () => observer.disconnect();
    }
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [showLogPanel, isOpen]);

  return (
    <div className="modal">
      <div className="modal__overlay" onClick={closeModal} />
      <div className="modal__content lead-modal__content" role="dialog" aria-modal="true">
        <div className="modal__header">
          <div className="modal__title-row modal__title-row--spaced">
            <h3>{editingId ? formData.lead_code || editingId : '리드 등록'}</h3>
            <IconButton onClick={closeModal} aria-label="닫기">
              <img src={xIcon} alt="" aria-hidden="true" />
            </IconButton>
          </div>
        </div>
        <div className="modal__body lead-modal__body">
          <div className="lead-modal__form lead-form" ref={mainPanelRef}>
            <form id="lead-form" className="project-form lead-form__content" onSubmit={handleSubmit}>
              <div className="lead-form__grid">
                <div className="lead-form__column">
              <label
                className="project-form__field lead-customer-select lead-customer-select--company"
                htmlFor="lead-customer-search"
              >
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
                            index === customerHighlightIndex
                              ? ' lead-customer-select__option--active'
                              : ''
                          }`}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleCustomerSelect(customer)}
                        >
                          {customer.company} ({customer.business_registration_number || '-'})
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
                  <label
                    className="project-form__field lead-customer-readonly"
                    htmlFor={`lead-customer-${field.name}`}
                    key={field.name}
                  >
                    {field.type === 'select' ? (
                      <select
                        id={`lead-customer-${field.name}`}
                        name={field.name}
                        value={customerForm[field.name] ?? field.options[0]}
                        data-filled={customerForm[field.name] ? 'true' : 'false'}
                        disabled
                      >
                        {field.options.map((option: string) => (
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
                        data-filled={customerForm[field.name] ? 'true' : 'false'}
                        readOnly
                      />
                    )}
                    <span>{field.label}</span>
                  </label>
                ))}
              <label
                className="project-form__field lead-customer-select lead-customer-select--contact"
                htmlFor="lead-contact-search"
              >
                <input
                  id="lead-contact-search"
                  name="lead-contact-search"
                  type="text"
                  placeholder=" "
                  value={contactQuery}
                  onChange={(event) => handleContactInput(event.target.value)}
                  onFocus={() => {
                    if (formData.customer_id) {
                      setContactListOpen(true);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setContactListOpen(false), 120);
                  }}
                  onKeyDown={(event) => {
                    if (!contactListOpen) {
                      return;
                    }
                    if (event.key === 'ArrowDown') {
                      event.preventDefault();
                      setContactHighlightIndex((prev) =>
                        Math.min(filteredContacts.length - 1, prev + 1)
                      );
                    } else if (event.key === 'ArrowUp') {
                      event.preventDefault();
                      setContactHighlightIndex((prev) => Math.max(-1, prev - 1));
                    } else if (event.key === 'Enter') {
                      if (contactHighlightIndex >= 0) {
                        event.preventDefault();
                        const selected = filteredContacts[contactHighlightIndex];
                        if (selected) {
                          handleContactSelect(selected);
                        }
                      }
                    } else if (event.key === 'Escape') {
                      setContactListOpen(false);
                    }
                  }}
                  disabled={!formData.customer_id}
                />
                <span>담당자</span>
                {formData.customer_id && contactListOpen && (
                  <div className="lead-customer-select__list" role="listbox">
                    {filteredContacts.length > 0 ? (
                      filteredContacts.map((contact, index) => (
                        <button
                          type="button"
                          key={contact.id}
                          className={`lead-customer-select__option${
                            index === contactHighlightIndex
                              ? ' lead-customer-select__option--active'
                              : ''
                          }`}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleContactSelect(contact)}
                        >
                          {contact.name} ({contact.contact || '-'})
                        </button>
                      ))
                    ) : (
                      <div className="lead-customer-select__empty">결과 없음</div>
                    )}
                  </div>
                )}
              </label>
              {contactDetailFields.map((field) => (
                <label
                  className="project-form__field lead-customer-readonly"
                  htmlFor={`lead-contact-${field.name}`}
                  key={field.name}
                >
                  <input
                    id={`lead-contact-${field.name}`}
                    name={field.name}
                    type={field.type}
                    placeholder=" "
                    value={contactForm[field.name] ?? ''}
                    data-filled={contactForm[field.name] ? 'true' : 'false'}
                    readOnly
                  />
                  <span>{field.label}</span>
                </label>
              ))}
                </div>
                <div className="lead-form__column">
                {leadFields.map((field) => (
                  <label
                    className={`project-form__field${
                      field.type === 'select' ? ' project-form__field--has-clear' : ''
                    }`}
                    htmlFor={`lead-${field.name}`}
                    key={field.name}
                  >
                    {field.type === 'textarea' ? (
                      <textarea
                        id={`lead-${field.name}`}
                        name={field.name}
                        rows={4}
                        placeholder=" "
                        value={formData[field.name] ?? ''}
                        onChange={(event) => handleChange(field.name, event.target.value)}
                      />
                    ) : field.type === 'select' ? (
                      <>
                        <select
                          id={`lead-${field.name}`}
                          name={field.name}
                          value={formData[field.name] ?? ''}
                          data-filled={formData[field.name] ? 'true' : 'false'}
                          onChange={(event) => handleChange(field.name, event.target.value)}
                        >
                          <option value="" hidden />
                          {field.options?.map((option: string) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
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
                    ) : (
                      <input
                        id={`lead-${field.name}`}
                        name={field.name}
                        type={field.type}
                        placeholder=" "
                        value={formData[field.name] ?? ''}
                        data-filled={
                          field.type === 'date' ? (formData[field.name] ? 'true' : 'false') : undefined
                        }
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
            </form>
          </div>
          {showLogPanel && (
            <div className="lead-modal__logs" ref={logsPanelRef}>
              {groupedLogs.length === 0 ? (
                <p className="table__status">기록이 없습니다.</p>
              ) : (
                <div className="lead-modal__logs-list" ref={logsListRef}>
                  {groupedLogs.map((group, groupIndex) => (
                    <div
                      className={`lead-modal__log-group${
                        groupIndex === groupedLogs.length - 1 ? ' lead-modal__log-group--last' : ''
                      }`}
                      key={group.date}
                    >
                      <div className="lead-modal__log-date-label">{group.date}</div>
                      <div className="lead-modal__log-group-body">
                        {group.items.map((entry, entryIndex) => {
                          const isLastGroup = groupIndex === groupedLogs.length - 1;
                          const isLastEntry = entryIndex === group.items.length - 1;
                          const isSelected = selectedLogId !== null && String(selectedLogId) === String(entry.id);
                          const entryClassName = `lead-modal__log-entry${
                            isLastGroup && isLastEntry ? ' lead-modal__log-entry--last' : ''
                          }${isSelected ? ' lead-modal__log-entry--selected' : ''}`;
                          return (
                          <div
                            className={entryClassName}
                            key={entry.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              const targetLog = leadLogs.find((log) => String(log.id) === String(entry.id));
                              if (targetLog) {
                                applyLogToForm(targetLog);
                              }
                            }}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                const targetLog = leadLogs.find((log) => String(log.id) === String(entry.id));
                                if (targetLog) {
                                  applyLogToForm(targetLog);
                                }
                              }
                            }}
                          >
                            <div className="lead-modal__log-time">
                              {entry.time}
                              {entry.isFirst ? ' (생성)' : ''}
                            </div>
                            <div className="lead-modal__log-lines">
                              {entry.changes.map((field) => (
                                <div className="lead-modal__log-line" key={field.key}>
                                  <span className="lead-modal__log-line-label">{field.label}</span>
                                  <span className="lead-modal__log-line-value">{field.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="modal__footer lead-form__footer">
          <div className="form-actions modal__actions">
            <button className="project-form__submit" type="submit" form="lead-form" disabled={formStatus === 'saving'}>
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
      </div>
    </div>
  );
}

export default LeadModal;
