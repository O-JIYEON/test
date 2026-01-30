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
  formStatus: string;
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
  formStatus,
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
  handleDelete
}: LeadModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal">
      <div className="modal__overlay" onClick={closeModal} />
      <div className="modal__content" role="dialog" aria-modal="true">
        <div className="modal__header">
          <div className="modal__title-row modal__title-row--spaced">
            <h3>{editingId ? formData.lead_code || editingId : '리드 등록'}</h3>
            <IconButton onClick={closeModal} aria-label="닫기">
              <img src={xIcon} alt="" aria-hidden="true" />
            </IconButton>
          </div>
        </div>
        <div className="modal__body lead-form">
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
