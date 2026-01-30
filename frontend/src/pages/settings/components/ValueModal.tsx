import IconButton from '../../../components/common/IconButton';
import xIcon from '../../../assets/icon/x.svg';

type ValueModalProps = {
  isOpen: boolean;
  valueEditingId: string | number | null;
  valueForm: {
    label: string;
    department: string;
    probability: string | number;
    sort_order: string | number;
  };
  setValueForm: (value: any) => void;
  isOwnerCategory: boolean;
  isPipelineCategory: boolean;
  closeModal: () => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

function ValueModal({
  isOpen,
  valueEditingId,
  valueForm,
  setValueForm,
  isOwnerCategory,
  isPipelineCategory,
  closeModal,
  handleSubmit
}: ValueModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal">
      <div className="modal__overlay" onClick={closeModal} />
      <div className="modal__content modal__content--white modal__content--compact" role="dialog" aria-modal="true">
        <div className="modal__header">
          <div className="modal__title-row modal__title-row--spaced">
            <h3>{valueEditingId ? '값 수정' : '값 등록'}</h3>
            <IconButton onClick={closeModal} aria-label="닫기">
              <img src={xIcon} alt="" aria-hidden="true" />
            </IconButton>
          </div>
        </div>
        <form className="project-form modal__body" onSubmit={handleSubmit}>
          <label className="project-form__field" htmlFor="value-label">
            <input
              id="value-label"
              name="label"
              type="text"
              placeholder=" "
              value={valueForm.label}
              onChange={(event) => setValueForm((prev) => ({ ...prev, label: event.target.value }))}
            />
            <span>값</span>
          </label>
          {isOwnerCategory && (
            <label className="project-form__field" htmlFor="value-department">
              <input
                id="value-department"
                name="department"
                type="text"
                placeholder=" "
                value={valueForm.department}
                onChange={(event) => setValueForm((prev) => ({ ...prev, department: event.target.value }))}
              />
              <span>부서</span>
            </label>
          )}
          {isPipelineCategory && (
            <label className="project-form__field" htmlFor="value-probability">
              <input
                id="value-probability"
                name="probability"
                type="number"
                step="0.01"
                placeholder=" "
                value={valueForm.probability}
                onChange={(event) => setValueForm((prev) => ({ ...prev, probability: event.target.value }))}
              />
              <span>확률</span>
            </label>
          )}
          <label className="project-form__field" htmlFor="value-sort">
            <input
              id="value-sort"
              name="sort_order"
              type="number"
              placeholder=" "
              value={valueForm.sort_order}
              onChange={(event) => setValueForm((prev) => ({ ...prev, sort_order: event.target.value }))}
            />
            <span>정렬</span>
          </label>
          <div className="form-actions modal__actions">
            <button className="project-form__submit" type="submit">
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ValueModal;
