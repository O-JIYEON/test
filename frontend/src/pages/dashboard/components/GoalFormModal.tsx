import IconButton from '../../../components/common/IconButton';
import xIcon from '../../../assets/icon/x.svg';

type GoalFormModalProps = {
  isOpen: boolean;
  goalTab: 'year' | 'month';
  goalFormInput: { period: string; amount: string };
  handleGoalFormChange: (field: 'period' | 'amount') => (event: React.ChangeEvent<HTMLInputElement>) => void;
  saveGoalForm: () => void;
  closeModal: () => void;
};

function GoalFormModal({
  isOpen,
  goalTab,
  goalFormInput,
  handleGoalFormChange,
  saveGoalForm,
  closeModal
}: GoalFormModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal">
      <div className="modal__overlay" onClick={closeModal} />
      <div className="modal__content modal__content--white goal-modal goal-modal--compact" role="dialog" aria-modal="true">
        <div className="modal__header">
          <h3>목표 등록</h3>
          <IconButton onClick={closeModal} aria-label="닫기">
            <img src={xIcon} alt="" aria-hidden="true" />
          </IconButton>
        </div>
        <div className="modal__body">
          <div className="goal-modal__grid">
            <label className="project-form__field">
              <input
                type="text"
                value={goalFormInput.period}
                onChange={handleGoalFormChange('period')}
                placeholder=" "
              />
              <span>{goalTab === 'year' ? '연도' : '연도-월'}</span>
            </label>
            <label className="project-form__field">
              <input
                type="text"
                value={goalFormInput.amount}
                onChange={handleGoalFormChange('amount')}
                placeholder=" "
              />
              <span>금액(원)</span>
            </label>
          </div>
          <div className="form-actions modal__actions">
            <button type="button" className="project-form__submit" onClick={saveGoalForm}>
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GoalFormModal;
