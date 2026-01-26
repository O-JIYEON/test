import { useEffect, useMemo, useState } from 'react';
import ConfirmDialog from '../../components/ConfirmDialog';

const API_BASE = `http://${window.location.hostname}:5001`;

const categoryColumns = [
  { key: 'id', label: 'id' },
  { key: 'label', label: '이름' }
];

const baseValueColumns = [
  { key: 'id', label: 'id' },
  { key: 'label', label: '값' },
  { key: 'sort_order', label: '정렬' },
  { key: 'delete', label: '삭제' }
];

const emptyCategory = { label: '' };
const emptyValue = { label: '', department: '', probability: '', sort_order: 0 };

function SettingsPage() {
  const [categories, setCategories] = useState([]);
  const [values, setValues] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [valueForm, setValueForm] = useState(emptyValue);
  const [categoryEditingId, setCategoryEditingId] = useState(null);
  const [valueEditingId, setValueEditingId] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isValueModalOpen, setIsValueModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });

  const showToast = (message) => {
    setToastMessage(message);
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      setToastMessage('');
    }, 1500);
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/lookup-categories`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch categories');
      }
      setCategories(data.categories || []);
      if (!selectedCategoryId && data.categories?.length) {
        setSelectedCategoryId(data.categories[0].id);
      }
    } catch (error) {
      console.error(error);
      showToast('카테고리를 불러오지 못했습니다.');
    }
  };

  const loadValues = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/lookup-values`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch values');
      }
      setValues(data.values || []);
    } catch (error) {
      console.error(error);
      showToast('값을 불러오지 못했습니다.');
    }
  };

  useEffect(() => {
    loadCategories();
    loadValues();
  }, []);

  const selectedCategory = categories.find((cat) => cat.id === selectedCategoryId) || null;
  const isPipelineCategory = selectedCategory?.label === '파이프라인 단계' || selectedCategory?.label === '딜단계';
  const isOwnerCategory = selectedCategory?.label === '담당자';
  const valueColumns = useMemo(() => {
    const columns = [
      { key: 'id', label: 'id' },
      { key: 'label', label: '값' }
    ];
    if (isOwnerCategory) {
      columns.push({ key: 'department', label: '부서' });
    }
    if (isPipelineCategory) {
      columns.push({ key: 'probability', label: '확률' });
    }
    columns.push({ key: 'sort_order', label: '정렬' }, { key: 'delete', label: '삭제' });
    return columns;
  }, [isPipelineCategory, isOwnerCategory]);

  const filteredValues = useMemo(() => {
    if (!selectedCategoryId) {
      return [];
    }
    return values.filter((value) => value.category_id === selectedCategoryId);
  }, [values, selectedCategoryId]);

  const openCategoryCreate = () => {
    setCategoryEditingId(null);
    setCategoryForm(emptyCategory);
    setIsCategoryModalOpen(true);
  };

  const openValueCreate = () => {
    if (!selectedCategoryId) {
      showToast('카테고리를 선택해 주세요.');
      return;
    }
    setValueEditingId(null);
    setValueForm(emptyValue);
    setIsValueModalOpen(true);
  };

  const openValueEdit = (value) => {
    setValueEditingId(value.id);
    setValueForm({
      label: value.label || '',
      department: value.department || '',
      probability: value.probability ?? '',
      sort_order: value.sort_order ?? 0
    });
    setIsValueModalOpen(true);
  };

  const handleCategorySubmit = async (event) => {
    event.preventDefault();
    const payload = {
      label: categoryForm.label
    };
    try {
      const response = await fetch(
        categoryEditingId ? `${API_BASE}/api/lookup-categories/${categoryEditingId}` : `${API_BASE}/api/lookup-categories`,
        {
          method: categoryEditingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save category');
      }
      await loadCategories();
      setIsCategoryModalOpen(false);
      showToast(categoryEditingId ? '카테고리가 수정되었습니다.' : '카테고리가 등록되었습니다.');
    } catch (error) {
      console.error(error);
      showToast('카테고리 저장에 실패했습니다.');
    }
  };

  const handleValueSubmit = async (event) => {
    event.preventDefault();
    if (!selectedCategoryId) {
      showToast('카테고리를 선택해 주세요.');
      return;
    }
    const payload = {
      ...valueForm,
      category_id: selectedCategoryId,
      probability:
        isPipelineCategory && valueForm.probability !== '' ? Number(valueForm.probability) : null,
      sort_order: Number(valueForm.sort_order) || 0
    };
    if (!isOwnerCategory) {
      delete payload.department;
    }
    try {
      const response = await fetch(
        valueEditingId ? `${API_BASE}/api/lookup-values/${valueEditingId}` : `${API_BASE}/api/lookup-values`,
        {
          method: valueEditingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save value');
      }
      await loadValues();
      setIsValueModalOpen(false);
      showToast(valueEditingId ? '값이 수정되었습니다.' : '값이 등록되었습니다.');
    } catch (error) {
      console.error(error);
      showToast('값 저장에 실패했습니다.');
    }
  };

  const handleValueDelete = (id) => {
    setConfirmState({
      open: true,
      message: '값을 삭제하시겠습니까?',
      onConfirm: async () => {
        try {
          const response = await fetch(`${API_BASE}/api/lookup-values/${id}`, { method: 'DELETE' });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Failed to delete value');
          }
          await loadValues();
          showToast('값이 삭제되었습니다.');
        } catch (error) {
          console.error(error);
          showToast('삭제에 실패했습니다.');
        } finally {
          setConfirmState({ open: false, message: '', onConfirm: null });
        }
      }
    });
  };

  return (
    <>
      <header className="content__header">
        <div className="content__header-row">
          <h2>설정</h2>
        </div>
      </header>
      <section className="content__section content__section--split">
        <div className="content__split-column">
          <div className="content__section-title-row">
            <h3 className="content__section-title">카테고리</h3>
          </div>
          <div className="content__card content__card--wide">
            <div className="content__card-header content__card-header--between">
              <div />
            </div>
            {categories.length === 0 && <p className="table__status">데이터가 없습니다.</p>}
            {categories.length > 0 && (
              <div className="table__wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      {categoryColumns.map((column) => (
                        <th key={column.key}>{column.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr
                        key={category.id}
                        className={`data-table__row${category.id === selectedCategoryId ? ' data-table__row--active' : ''}`}
                        onClick={() => setSelectedCategoryId(category.id)}
                      >
                        {categoryColumns.map((column) => {
                          return <td key={column.key}>{category[column.key] ?? ''}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <div className="content__split-column">
          <div className="content__section-title-row">
            <h3 className="content__section-title">값</h3>
            <span className="content__section-meta">{selectedCategory?.label ?? '카테고리 선택'}</span>
          </div>
          <div className="content__card content__card--wide">
            <div className="content__card-header content__card-header--between">
              <div />
              <button
                className="project-form__submit project-form__submit--compact"
                type="button"
                onClick={openValueCreate}
                disabled={!selectedCategoryId}
              >
                등록
              </button>
            </div>
            {!selectedCategoryId && <p className="table__status">카테고리를 선택해 주세요.</p>}
            {selectedCategoryId && filteredValues.length === 0 && <p className="table__status">데이터가 없습니다.</p>}
            {selectedCategoryId && filteredValues.length > 0 && (
              <div className="table__wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      {valueColumns.map((column) => (
                        <th key={column.key}>{column.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredValues.map((value) => (
                      <tr key={value.id} className="data-table__row" onClick={() => openValueEdit(value)}>
                        {valueColumns.map((column) => {
                          if (column.key === 'delete') {
                            return (
                              <td key={column.key}>
                                <button
                                  className="icon-button icon-button--danger"
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleValueDelete(value.id);
                                  }}
                                  aria-label="값 삭제"
                                >
                                  <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <path
                                      d="M6 7h12l-1 13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7z"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                    <path
                                      d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </button>
                              </td>
                            );
                          }
                          return <td key={column.key}>{value[column.key] ?? ''}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
      {isCategoryModalOpen && (
        <div className="modal">
          <div className="modal__overlay" onClick={() => setIsCategoryModalOpen(false)} />
          <div className="modal__content modal__content--white modal__content--compact" role="dialog" aria-modal="true">
            <div className="modal__header">
              <div className="modal__title-row modal__title-row--spaced">
                <h3>{categoryEditingId ? '카테고리 수정' : '카테고리 등록'}</h3>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  aria-label="닫기"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6.4 5l12.6 12.6-1.4 1.4L5 6.4 6.4 5z" />
                    <path d="M19 6.4 6.4 19l-1.4-1.4L17.6 5 19 6.4z" />
                  </svg>
                </button>
              </div>
            </div>
            <form className="project-form modal__body" onSubmit={handleCategorySubmit}>
              <label className="project-form__field" htmlFor="category-label">
                <input
                  id="category-label"
                  name="label"
                  type="text"
                  placeholder=" "
                  value={categoryForm.label}
                  onChange={(event) => setCategoryForm((prev) => ({ ...prev, label: event.target.value }))}
                />
                <span>이름</span>
              </label>
              <div className="form-actions modal__actions">
                <button className="project-form__submit" type="submit">
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isValueModalOpen && (
        <div className="modal">
          <div className="modal__overlay" onClick={() => setIsValueModalOpen(false)} />
          <div className="modal__content modal__content--white modal__content--compact" role="dialog" aria-modal="true">
            <div className="modal__header">
              <div className="modal__title-row modal__title-row--spaced">
                <h3>{valueEditingId ? '값 수정' : '값 등록'}</h3>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => setIsValueModalOpen(false)}
                  aria-label="닫기"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6.4 5l12.6 12.6-1.4 1.4L5 6.4 6.4 5z" />
                    <path d="M19 6.4 6.4 19l-1.4-1.4L17.6 5 19 6.4z" />
                  </svg>
                </button>
              </div>
            </div>
            <form className="project-form modal__body" onSubmit={handleValueSubmit}>
              <label className="project-form__field" htmlFor="value-label">
                <input
                  id="value-label"
                  name="label"
                  type="text"
                  placeholder=" "
                  value={valueForm.label}
                  onChange={(event) => setValueForm((prev) => ({ ...prev, label: event.target.value }))}
                />
                <span>값</span>
              </label>
              {isOwnerCategory && (
                <label className="project-form__field" htmlFor="value-department">
                  <input
                    id="value-department"
                    name="department"
                    type="text"
                    placeholder=" "
                    value={valueForm.department}
                    onChange={(event) => setValueForm((prev) => ({ ...prev, department: event.target.value }))}
                  />
                  <span>부서</span>
                </label>
              )}
              {isPipelineCategory && (
                <label className="project-form__field" htmlFor="value-probability">
                  <input
                    id="value-probability"
                    name="probability"
                    type="number"
                    step="0.01"
                    placeholder=" "
                    value={valueForm.probability}
                    onChange={(event) => setValueForm((prev) => ({ ...prev, probability: event.target.value }))}
                  />
                  <span>확률</span>
                </label>
              )}
              <label className="project-form__field" htmlFor="value-sort">
                <input
                  id="value-sort"
                  name="sort_order"
                  type="number"
                  placeholder=" "
                  value={valueForm.sort_order}
                  onChange={(event) => setValueForm((prev) => ({ ...prev, sort_order: event.target.value }))}
                />
                <span>정렬</span>
              </label>
              <div className="form-actions modal__actions">
                <button className="project-form__submit" type="submit">
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirmState.open}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm || (() => setConfirmState({ open: false, message: '', onConfirm: null }))}
        onCancel={() => setConfirmState({ open: false, message: '', onConfirm: null })}
      />
      {toastMessage && <div className="toast">{toastMessage}</div>}
    </>
  );
}

export default SettingsPage;
