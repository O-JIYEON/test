import { useEffect, useState } from 'react';
import ConfirmDialog from '../../components/ConfirmDialog';

const API_BASE = `http://${window.location.hostname}:5001`;

const sourceOptions = ['전체', '문의(웹/매일)', '소개', '전시/세미나', '재접촉', '콜드', '파트너'];
const productLineOptions = ['전체', 'SI(프로젝트)', '유지보수', 'PoC/데모', '구독/라이센스', 'HW+SW'];
const regionOptions = ['전체', '수도권', '영남', '호남', '충청', '강원', '제주', '해외'];
const segmentOptions = ['전체', 'Enterprise', 'SMB', '공공', '제조', '에너지', '조선/해양', '건설'];

const customerFields = [
  { name: 'company', label: '회사', type: 'text' },
  { name: 'owner', label: '담당자', type: 'text' },
  { name: 'customer_owner', label: '담당자(영업)', type: 'text' },
  { name: 'contact', label: '연락처', type: 'text' },
  { name: 'email', label: '이메일', type: 'text' },
  { name: 'source', label: '유입경로', type: 'select', options: sourceOptions },
  { name: 'product_line', label: '제품라인', type: 'select', options: productLineOptions },
  { name: 'region', label: '지역', type: 'select', options: regionOptions },
  { name: 'segment', label: '세그먼트', type: 'select', options: segmentOptions }
];

const customerColumns = [
  { key: 'id', label: 'id' },
  { key: 'company', label: '회사' },
  { key: 'owner', label: '담당자' },
  { key: 'customer_owner', label: '담당자(영업)' },
  { key: 'contact', label: '연락처' },
  { key: 'email', label: '이메일' },
  { key: 'source', label: '유입경로' },
  { key: 'product_line', label: '제품라인' },
  { key: 'region', label: '지역' },
  { key: 'segment', label: '세그먼트' },
  { key: 'created_at', label: '생성일' },
  { key: 'updated_at', label: '수정일', hidden: true }
];

const formatDate = (value) => {
  if (!value) {
    return '';
  }
  const text = String(value).replace('T', ' ');
  if (text.length >= 16) {
    return text.slice(0, 16);
  }
  return text.length >= 10 ? text.slice(0, 10) : text;
};

function CustomersPage() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading');
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [formStatus, setFormStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [confirmState, setConfirmState] = useState({
    open: false,
    message: '',
    onConfirm: null
  });
  const pageSize = 10;

  const loadItems = async () => {
    try {
      setStatus('loading');
      const response = await fetch(`${API_BASE}/api/customers`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch customers');
      }
      setItems(data.customers || []);
      setStatus('ready');
      setPage(1);
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      source: sourceOptions[0],
      product_line: productLineOptions[0],
      region: regionOptions[0],
      segment: segmentOptions[0]
    });
    setFormStatus('');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    const nextData = customerFields.reduce((acc, field) => {
      acc[field.name] = item[field.name] ?? (field.type === 'select' ? field.options[0] : '');
      return acc;
    }, {});
    setFormData(nextData);
    setFormStatus('');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const submitItem = async () => {
    setFormStatus('saving');
    try {
      const response = await fetch(
        editingId
          ? `${API_BASE}/api/customers/${editingId}`
          : `${API_BASE}/api/customers`,
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save customers');
      }
      await loadItems();
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({});
      setFormStatus('');
      setErrorMessage('');
    } catch (error) {
      console.error(error);
      setFormStatus('error');
      setErrorMessage('저장에 실패했습니다.');
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setConfirmState({
      open: true,
      message: editingId ? 'Customers 정보를 수정하시겠습니까?' : 'Customers 정보를 등록하시겠습니까?',
      onConfirm: () => {
        submitItem();
        setConfirmState({ open: false, message: '', onConfirm: null });
      }
    });
  };

  const deleteItem = async (item) => {
    try {
      const response = await fetch(`${API_BASE}/api/customers/${item.id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete customers');
      }
      await loadItems();
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({});
      setFormStatus('');
      setErrorMessage('');
    } catch (error) {
      console.error(error);
      setErrorMessage('삭제에 실패했습니다.');
    }
  };

  const handleDelete = () => {
    if (!editingId) {
      return;
    }
    setConfirmState({
      open: true,
      message: 'Customers 정보를 삭제하시겠습니까?',
      onConfirm: () => {
        deleteItem({ id: editingId });
        setConfirmState({ open: false, message: '', onConfirm: null });
      }
    });
  };

  const handleConfirmCancel = () => {
    setConfirmState({ open: false, message: '', onConfirm: null });
  };

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const pageStart = (clampedPage - 1) * pageSize;
  const visibleItems = items.slice(pageStart, pageStart + pageSize);
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <>
      <header className="content__header">
        <div className="content__header-row">
          <h2>Customers</h2>
          <button className="project-form__submit" type="button" onClick={openCreateModal}>
            Customers 등록
          </button>
        </div>
      </header>
      <section className="content__section content__section--single">
        <div className="content__card content__card--wide">
          {status === 'loading' && <p className="table__status">불러오는 중...</p>}
          {status === 'error' && (
            <p className="table__status table__status--error">데이터를 불러오지 못했습니다.</p>
          )}
          {status === 'ready' && items.length === 0 && <p className="table__status">데이터가 없습니다.</p>}
          {status === 'ready' && items.length > 0 && (
            <div className="table__wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    {customerColumns
                      .filter((column) => !column.hidden)
                      .map((column) => (
                        <th key={column.key}>{column.label}</th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.map((item) => (
                    <tr key={item.id} className="data-table__row" onClick={() => openEditModal(item)}>
                      {customerColumns
                        .filter((column) => !column.hidden)
                        .map((column) => {
                        if (column.key === 'created_at' || column.key === 'updated_at') {
                          return <td key={column.key}>{formatDate(item[column.key])}</td>;
                        }
                        return <td key={column.key}>{item[column.key] ?? ''}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {status === 'ready' && items.length > pageSize && (
            <div className="pagination">
              <button
                className="icon-button"
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={clampedPage === 1}
                aria-label="이전 페이지"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15.5 19l-7-7 7-7" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
              <div className="pagination__pages">
                {pages.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    className={`pagination__page${pageNumber === clampedPage ? ' pagination__page--active' : ''}`}
                    type="button"
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={clampedPage === totalPages}
                aria-label="다음 페이지"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.5 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </section>
      {isModalOpen && (
        <div className="modal">
          <div className="modal__overlay" onClick={closeModal} />
          <div className="modal__content" role="dialog" aria-modal="true">
            <div className="modal__header">
              <div className="modal__title-row modal__title-row--spaced">
                <h3>{editingId ? 'Customers 수정' : 'Customers 등록'}</h3>
                <button className="icon-button" type="button" onClick={closeModal} aria-label="닫기">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6.4 5l12.6 12.6-1.4 1.4L5 6.4 6.4 5z" />
                    <path d="M19 6.4 6.4 19l-1.4-1.4L17.6 5 19 6.4z" />
                  </svg>
                </button>
              </div>
            </div>
            <form className="project-form modal__body" onSubmit={handleSubmit}>
              {customerFields.map((field) => (
                <label className="project-form__field" htmlFor={`customer-${field.name}`} key={field.name}>
                  {field.type === 'select' ? (
                    <select
                      id={`customer-${field.name}`}
                      name={field.name}
                      value={formData[field.name] ?? field.options[0]}
                      data-filled={formData[field.name] ? 'true' : 'false'}
                      onChange={(event) => handleChange(field.name, event.target.value)}
                    >
                      {field.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={`customer-${field.name}`}
                      name={field.name}
                      type={field.type}
                      placeholder=" "
                      value={formData[field.name] ?? ''}
                      onChange={(event) => handleChange(field.name, event.target.value)}
                    />
                  )}
                  <span>{field.label}</span>
                </label>
              ))}
              <div className="form-actions modal__actions">
                <button className="project-form__submit" type="submit" disabled={formStatus === 'saving'}>
                  {editingId ? '저장' : '등록'}
                </button>
                {editingId && (
                  <button
                    className="project-form__submit project-form__submit--danger"
                    type="button"
                    onClick={handleDelete}
                  >
                    삭제
                  </button>
                )}
              </div>
              {errorMessage && <p className="table__status table__status--error">{errorMessage}</p>}
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirmState.open}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm || handleConfirmCancel}
        onCancel={handleConfirmCancel}
      />
    </>
  );
}

export default CustomersPage;
