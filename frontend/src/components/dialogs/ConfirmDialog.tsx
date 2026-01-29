import './confirmDialog.css';

function ConfirmDialog({ open, message, confirmLabel = '확인', cancelLabel = '취소', onConfirm, onCancel }) {
  if (!open) {
    return null;
  }

  return (
    <div className="confirm-dialog" role="dialog" aria-modal="true">
      <div className="confirm-dialog__overlay" onClick={onCancel} />
      <div className="confirm-dialog__content">
        <p className="confirm-dialog__message">{message}</p>
        <div className="confirm-dialog__actions">
          <button className="form-actions__reset" type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="project-form__submit" type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
