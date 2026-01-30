import IconButton from '../../../components/common/IconButton';
import xIcon from '../../../assets/icon/x.svg';

type LeadInfoModalProps = {
  isOpen: boolean;
  selectedLead: any;
  leadCustomerFields: Array<any>;
  leadDetailFields: Array<any>;
  closeModal: () => void;
  formatDate: (value: any) => string;
};

function LeadInfoModal({
  isOpen,
  selectedLead,
  leadCustomerFields,
  leadDetailFields,
  closeModal,
  formatDate
}: LeadInfoModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal">
      <div className="modal__overlay" onClick={closeModal} />
      <div className="modal__content" role="dialog" aria-modal="true">
        <div className="modal__header">
          <div className="modal__title-row modal__title-row--spaced">
            <h3>리드 정보</h3>
            <IconButton onClick={closeModal} aria-label="닫기">
              <img src={xIcon} alt="" aria-hidden="true" />
            </IconButton>
          </div>
        </div>
        <div className="modal__body">
          {selectedLead ? (
            <div className="lead-info">
              <div className="lead-info__grid">
                <div className="lead-info__column">
                  {leadCustomerFields.map((field) => (
                    <div className="lead-info__item" key={field.name}>
                      <span className="lead-info__label">{field.label}</span>
                      <span className="lead-info__value">{selectedLead[field.name] ?? '-'}</span>
                    </div>
                  ))}
                </div>
                <div className="lead-info__column">
                  {leadDetailFields.map((field) => {
                    const rawValue = selectedLead[field.name];
                    const displayValue = field.type === 'date' ? formatDate(rawValue) : rawValue ?? '-';
                    return (
                      <div className="lead-info__item" key={field.name}>
                        <span className="lead-info__label">{field.label}</span>
                        <span className="lead-info__value">{displayValue || '-'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <p className="table__status">리드 정보를 찾을 수 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default LeadInfoModal;
