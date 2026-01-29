function Modal({ isOpen, onClose, className = '', contentClassName = '', children }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={`modal ${className}`.trim()}>
      <div className="modal__overlay" onClick={onClose} />
      <div className={`modal__content ${contentClassName}`.trim()} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}

export default Modal;
