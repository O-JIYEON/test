import IconButton from '../../../components/common/IconButton';
import xIcon from '../../../assets/icon/x.svg';

type GoalModalProps = {
  isOpen: boolean;
  goalTab: 'year' | 'month';
  goalRows: Array<any>;
  trashIcon: string;
  setGoalTab: (value: 'year' | 'month') => void;
  openGoalFormModal: () => void;
  openGoalEditModal: (goal: any) => void;
  deleteGoal: (id: string | number) => void;
  formatGoalPeriod: (goal: any) => string;
  formatAmount: (value: any) => string;
  closeModal: () => void;
};

function GoalModal({
  isOpen,
  goalTab,
  goalRows,
  trashIcon,
  setGoalTab,
  openGoalFormModal,
  openGoalEditModal,
  deleteGoal,
  formatGoalPeriod,
  formatAmount,
  closeModal
}: GoalModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal">
      <div className="modal__overlay" onClick={closeModal} />
      <div className="modal__content modal__content--white goal-modal" role="dialog" aria-modal="true">
        <div className="modal__header goal-modal__header">
          <div className="goal-modal__tabs" data-active-index={goalTab === 'month' ? '1' : '0'}>
            <button
              type="button"
              className={`goal-modal__tab${goalTab === 'year' ? ' goal-modal__tab--active' : ''}`}
              onClick={() => setGoalTab('year')}
            >
              연도별
            </button>
            <button
              type="button"
              className={`goal-modal__tab${goalTab === 'month' ? ' goal-modal__tab--active' : ''}`}
              onClick={() => setGoalTab('month')}
            >
              월별
            </button>
          </div>
          <button type="button" className="goal-modal__submit" onClick={openGoalFormModal}>
            등록
          </button>
          <IconButton onClick={closeModal} aria-label="닫기">
            <img src={xIcon} alt="" aria-hidden="true" />
          </IconButton>
        </div>
        <div className="modal__body">
          <div className="goal-modal__list">
            <table className="data-table">
              <thead>
                <tr>
                  <th>기간</th>
                  <th>목표금액(원)</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {goalRows.length === 0 && (
                  <tr className="data-table__row data-table__row--empty">
                    <td colSpan={3} className="data-table__empty">데이터가 없습니다.</td>
                  </tr>
                )}
                {goalRows.map((goal) => (
                  <tr key={goal.id} className="data-table__row" onClick={() => openGoalEditModal(goal)}>
                    <td>{formatGoalPeriod(goal)}</td>
                    <td>{formatAmount(goal.amount)}</td>
                    <td className="goal-modal__actions">
                      <button
                        type="button"
                        className="goal-modal__action goal-modal__action--ghost"
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteGoal(goal.id);
                        }}
                      >
                        <img src={trashIcon} alt="삭제" className="goal-modal__trash" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GoalModal;
