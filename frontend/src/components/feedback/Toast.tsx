import infoIcon from '../../assets/icon/toast/info.svg';
import warningIcon from '../../assets/icon/toast/warning.svg';
import errorIcon from '../../assets/icon/toast/error.svg';
import successIcon from '../../assets/icon/toast/success.svg';
import './toast.css';

const iconByVariant = {
  info: infoIcon,
  warning: warningIcon,
  error: errorIcon,
  success: successIcon
};

function Toast({ message, variant = 'info', className = '', onClose }) {
  if (!message) {
    return null;
  }
  const resolvedVariant = iconByVariant[variant] ? variant : 'info';
  const variantClass = resolvedVariant ? `toast--${resolvedVariant}` : '';
  const classes = ['toast', variantClass, className].filter(Boolean).join(' ');
  const iconSrc = iconByVariant[resolvedVariant];

  return (
    <div className={classes} role="status" aria-live="polite">
      <span className="toast__icon" aria-hidden="true">
        <img src={iconSrc} alt="" />
      </span>
      <span className="toast__message">{message}</span>
      {onClose && (
        <button className="toast__close" type="button" onClick={onClose} aria-label="닫기">
          ×
        </button>
      )}
    </div>
  );
}

export default Toast;
