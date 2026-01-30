import IconButton from '../../../components/common/IconButton';

type ContactModalProps = {
  isOpen: boolean;
  contactEditingId: string | number | null;
  contactFields: Array<any>;
  contactFormData: Record<string, any>;
  contactFormStatus: string;
  contactErrorMessage: string | null;
  closeModal: () => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  handleChange: (name: string, value: any) => void;
  handleDelete: () => void;
};

function ContactModal({
  isOpen,
  contactEditingId,
  contactFields,
  contactFormData,
  contactFormStatus,
  contactErrorMessage,
  closeModal,
  handleSubmit,
  handleChange,
  handleDelete
}: ContactModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal">
      <div className="modal__overlay" onClick={closeModal} />
      <div className="modal__content modal__content--compact" role="dialog" aria-modal="true">
        <div className="modal__header">
          <div className="modal__title-row modal__title-row--spaced">
            <h3>{contactEditingId ? '담당자 수정' : '담당자 등록'}</h3>
            <IconButton onClick={closeModal} aria-label="닫기">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6.4 5l12.6 12.6-1.4 1.4L5 6.4 6.4 5z" />
                <path d="M19 6.4 6.4 19l-1.4-1.4L17.6 5 19 6.4z" />
              </svg>
            </IconButton>
          </div>
        </div>
        <form className="project-form modal__body" onSubmit={handleSubmit}>
          {contactFields.map((field) => (
            <label className="project-form__field" htmlFor={`contact-${field.name}`} key={field.name}>
              <input
                id={`contact-${field.name}`}
                name={field.name}
                type={field.type}
                placeholder=" "
                value={contactFormData[field.name] ?? ''}
                onChange={(event) => handleChange(field.name, event.target.value)}
              />
              <span>{field.label}</span>
            </label>
          ))}
          <div className="form-actions modal__actions">
            <button className="project-form__submit" type="submit" disabled={contactFormStatus === 'saving'}>
              {contactEditingId ? '저장' : '등록'}
            </button>
            {contactEditingId && (
              <button
                className="project-form__submit project-form__submit--danger"
                type="button"
                onClick={handleDelete}
              >
                삭제
              </button>
            )}
          </div>
          {contactErrorMessage && null}
        </form>
      </div>
    </div>
  );
}

export default ContactModal;
