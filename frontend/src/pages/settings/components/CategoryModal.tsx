import IconButton from '../../../components/common/IconButton';
import xIcon from '../../../assets/icon/x.svg';

type CategoryModalProps = {
  isOpen: boolean;
  categoryEditingId: string | number | null;
  categoryForm: { label: string };
  setCategoryForm: (value: any) => void;
  closeModal: () => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

function CategoryModal({
  isOpen,
  categoryEditingId,
  categoryForm,
  setCategoryForm,
  closeModal,
  handleSubmit
}: CategoryModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal">
      <div className="modal__overlay" onClick={closeModal} />
      <div className="modal__content modal__content--white modal__content--compact" role="dialog" aria-modal="true">
        <div className="modal__header">
          <div className="modal__title-row modal__title-row--spaced">
            <h3>{categoryEditingId ? '카테고리 수정' : '카테고리 등록'}</h3>
            <IconButton onClick={closeModal} aria-label="닫기">
              <img src={xIcon} alt="" aria-hidden="true" />
            </IconButton>
          </div>
        </div>
        <form className="project-form" onSubmit={handleSubmit}>
          <div className="modal__body">
            <label className="project-form__field" htmlFor="category-label">
              <input
                id="category-label"
                name="label"
                type="text"
                placeholder=" "
                value={categoryForm.label}
                onChange={(event) => setCategoryForm((prev) => ({ ...prev, label: event.target.value }))}
              />
              <span>이름</span>
            </label>
          </div>
          <div className="modal__footer">
            <div className="form-actions modal__actions">
              <button className="project-form__submit" type="submit">
                저장
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CategoryModal;
