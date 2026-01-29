function Toast({ message, variant = '', className = '' }) {
  if (!message) {
    return null;
  }
  const variantClass = variant ? `toast--${variant}` : '';
  const classes = ['toast', variantClass, className].filter(Boolean).join(' ');
  return <div className={classes}>{message}</div>;
}

export default Toast;
