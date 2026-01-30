import './pagination.css';

function Pagination({ page, totalPages, onChange, variant = 'text' }) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const isIcon = variant === 'icon';
  const prevClassName = isIcon ? 'icon-button' : 'pagination__arrow';
  const nextClassName = isIcon ? 'icon-button' : 'pagination__arrow';

  return (
    <div className="pagination">
      <button
        className={prevClassName}
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label={isIcon ? '이전 페이지' : undefined}
      >
        {isIcon ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15.5 19l-7-7 7-7" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        ) : (
          '이전'
        )}
      </button>
      <div className="pagination__pages">
        {pages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            className={`pagination__page${pageNumber === page ? ' pagination__page--active' : ''}`}
            onClick={() => onChange(pageNumber)}
          >
            {pageNumber}
          </button>
        ))}
      </div>
      <button
        className={nextClassName}
        type="button"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        aria-label={isIcon ? '다음 페이지' : undefined}
      >
        {isIcon ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8.5 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        ) : (
          '다음'
        )}
      </button>
    </div>
  );
}

export default Pagination;
