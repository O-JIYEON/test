import { useEffect, useState } from 'react';

const API_BASE = `http://${window.location.hostname}:5001`;
import ConfirmDialog from '../../components/ConfirmDialog';

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [columns, setColumns] = useState([]);
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState('loading');
  const [formStatus, setFormStatus] = useState('');
  const [sortState, setSortState] = useState({ key: null, direction: null });
  const [confirmState, setConfirmState] = useState({
    open: false,
    message: '',
    onConfirm: null
  });

  const editableColumns = columns.filter((column) => !column.isAutoIncrement);
  const idColumn = columns.find((column) => column.name === 'id')?.name || 'id';

  const loadUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/users`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }
      setUsers(data.users || []);
      setStatus('ready');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchSchemaAndUsers() {
      try {
        const response = await fetch(`${API_BASE}/api/users/schema`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch schema');
        }
        if (isMounted) {
          setColumns(data.columns || []);
        }
        await loadUsers();
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setStatus('error');
        }
      }
    }

    fetchSchemaAndUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({});
    setEditingId(null);
    setFormStatus('');
  };

  const submitUser = async () => {
    setFormStatus('saving');
    try {
      const response = await fetch(
        editingId ? `${API_BASE}/api/users/${editingId}` : `${API_BASE}/api/users`,
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save user');
      }
      await loadUsers();
      resetForm();
      setFormStatus('saved');
    } catch (error) {
      console.error(error);
      setFormStatus('error');
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setConfirmState({
      open: true,
      message: editingId ? '사용자 정보를 수정하시겠습니까?' : '사용자를 등록하시겠습니까?',
      onConfirm: () => {
        submitUser();
        setConfirmState({ open: false, message: '', onConfirm: null });
      }
    });
  };

  const handleEdit = (user) => {
    setEditingId(user[idColumn]);
    const nextData = editableColumns.reduce((acc, column) => {
      acc[column.name] = user[column.name] ?? '';
      return acc;
    }, {});
    setFormData(nextData);
    setFormStatus('');
  };

  const deleteUser = async (user) => {
    const userId = user[idColumn];
    if (!userId) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/api/users/${userId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }
      await loadUsers();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = (user) => {
    const userId = user[idColumn];
    if (!userId) {
      return;
    }
    setConfirmState({
      open: true,
      message: '사용자를 삭제하시겠습니까?',
      onConfirm: () => {
        deleteUser(user);
        setConfirmState({ open: false, message: '', onConfirm: null });
      }
    });
  };

  const handleConfirmCancel = () => {
    setConfirmState({ open: false, message: '', onConfirm: null });
  };

  const handleSort = (key) => {
    setSortState((prev) => {
      if (prev.key !== key) {
        return { key, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      if (prev.direction === 'desc') {
        return { key: null, direction: null };
      }
      return { key, direction: 'asc' };
    });
  };

  const sortedUsers = (() => {
    if (!sortState.key || !sortState.direction) {
      return users;
    }
    const sorted = [...users];
    const directionFactor = sortState.direction === 'asc' ? 1 : -1;
    sorted.sort((left, right) => {
      const leftValue = left[sortState.key];
      const rightValue = right[sortState.key];
      if (leftValue === null || leftValue === undefined) {
        return 1;
      }
      if (rightValue === null || rightValue === undefined) {
        return -1;
      }
      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        return (leftValue - rightValue) * directionFactor;
      }
      return String(leftValue).localeCompare(String(rightValue), 'ko-KR', {
        numeric: true,
        sensitivity: 'base'
      }) * directionFactor;
    });
    return sorted;
  })();

  const userColumns = users.length > 0 ? Object.keys(users[0]) : [];

  return (
    <>
      <header className="content__header">
        <h2>사용자</h2>
        <p>MySQL test DB의 user 테이블 데이터를 관리합니다.</p>
      </header>
      <section className="content__section content__section--single">
        <div className="content__card content__card--form">
          <h3>{editingId ? '사용자 수정' : '사용자 등록'}</h3>
          <form className="project-form" onSubmit={handleSubmit}>
            {editableColumns.length === 0 && (
              <p className="table__status">입력 가능한 컬럼이 없습니다.</p>
            )}
            {editableColumns.map((column) => (
              <label className="project-form__field" htmlFor={`user-${column.name}`} key={column.name}>
                <input
                  id={`user-${column.name}`}
                  name={column.name}
                  type="text"
                  value={formData[column.name] ?? ''}
                  onChange={(event) => handleChange(column.name, event.target.value)}
                  placeholder=" "
                />
                <span>{column.name}</span>
              </label>
            ))}
            <div className="form-actions">
              <button className="project-form__submit" type="submit" disabled={formStatus === 'saving'}>
                {editingId ? '저장' : '등록'}
              </button>
              {editingId && (
                <button className="form-actions__reset" type="button" onClick={resetForm}>
                  취소
                </button>
              )}
            </div>
            {formStatus === 'error' && (
              <p className="table__status table__status--error">저장에 실패했습니다.</p>
            )}
          </form>
        </div>
        <div className="content__card content__card--form">
          <h3>사용자 목록</h3>
          {status === 'loading' && <p className="table__status">불러오는 중...</p>}
          {status === 'error' && (
            <p className="table__status table__status--error">
              데이터를 불러오지 못했습니다.
            </p>
          )}
          {status === 'ready' && users.length === 0 && (
            <p className="table__status">데이터가 없습니다.</p>
          )}
          {status === 'ready' && users.length > 0 && (
            <div className="table__wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    {userColumns.map((key) => (
                      <th key={key}>
                        <button className="table-sort" type="button" onClick={() => handleSort(key)}>
                          {key}
                          <span className="table-sort__icon">
                            {sortState.key === key
                              ? sortState.direction === 'asc'
                                ? '▲'
                                : sortState.direction === 'desc'
                                  ? '▼'
                                  : ''
                              : ''}
                          </span>
                        </button>
                      </th>
                    ))}
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.map((user, index) => (
                    <tr key={user[idColumn] ?? index}>
                      {userColumns.map((key) => (
                        <td key={key}>{String(user[key])}</td>
                      ))}
                      <td>
                        <div className="table-actions">
                          <button
                            className="icon-button"
                            type="button"
                            onClick={() => handleEdit(user)}
                            aria-label="사용자 수정"
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M4 16.5V20h3.5L18.4 9.1l-3.5-3.5L4 16.5z" />
                              <path d="M19.7 7.8c.4-.4.4-1 0-1.4L17.6 4.3c-.4-.4-1-.4-1.4 0l-1.6 1.6 3.5 3.5 1.6-1.6z" />
                            </svg>
                          </button>
                          <button
                            className="icon-button icon-button--danger"
                            type="button"
                            onClick={() => handleDelete(user)}
                            aria-label="사용자 삭제"
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M6 7h12l-1 13H7L6 7z" />
                              <path d="M9 4h6l1 2H8l1-2z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
      <ConfirmDialog
        open={confirmState.open}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm || handleConfirmCancel}
        onCancel={handleConfirmCancel}
      />
    </>
  );
}

export default UsersPage;
