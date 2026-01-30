import IconButton from '../../../components/common/IconButton';

type CustomerModalProps = {
  isOpen: boolean;
  editingId: string | number | null;
  customerFields: Array<any>;
  formData: Record<string, any>;
  formStatus: string;
  errorMessage: string | null;
  closeModal: () => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  handleChange: (name: string, value: any) => void;
  handleDelete: () => void;
};

function CustomerModal({
  isOpen,
  editingId,
  customerFields,
  formData,
  formStatus,
  errorMessage,
  closeModal,
  handleSubmit,
  handleChange,
  handleDelete
}: CustomerModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal">
      <div className="modal__overlay" onClick={closeModal} />
      <div className="modal__content modal__content--compact" role="dialog" aria-modal="true">
        <div className="modal__header">
          <div className="modal__title-row modal__title-row--spaced">
            <h3>{editingId ? '고객사 수정' : '고객사 등록'}</h3>
            <IconButton onClick={closeModal} aria-label="닫기">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6.4 5l12.6 12.6-1.4 1.4L5 6.4 6.4 5z" />
                <path d="M19 6.4 6.4 19l-1.4-1.4L17.6 5 19 6.4z" />
              </svg>
            </IconButton>
          </div>
        </div>
        <form className="project-form modal__body" onSubmit={handleSubmit}>
          {customerFields.map((field) => (
            <label className="project-form__field" htmlFor={`customer-${field.name}`} key={field.name}>
              {field.type === 'select' ? (
                <select
                  id={`customer-${field.name}`}
                  name={field.name}
                  value={formData[field.name] ?? field.options[0]}
                  data-filled={formData[field.name] ? 'true' : 'false'}
                  onChange={(event) => handleChange(field.name, event.target.value)}
                >
                  {field.options.map((option: string) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={`customer-${field.name}`}
                  name={field.name}
                  type={field.type}
                  placeholder=" "
                  value={formData[field.name] ?? ''}
                  onChange={(event) => handleChange(field.name, event.target.value)}
                />
              )}
              <span>{field.label}</span>
            </label>
          ))}
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
          {errorMessage && null}
        </form>
      </div>
    </div>
  );
}

export default CustomerModal;
