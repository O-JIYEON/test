import './iconButton.css';

function IconButton({ type = 'button', className = '', children, ...props }) {
  const classes = ['icon-button', className].filter(Boolean).join(' ');
  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}

export default IconButton;
