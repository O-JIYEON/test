import { useEffect, useState } from 'react';

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [columns, setColumns] = useState([]);
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState('loading');
  const [formStatus, setFormStatus] = useState('');

  const editableColumns = columns.filter((column) => !column.isAutoIncrement);
  const idColumn = columns.find((column) => column.name === 'id')?.name || 'id';

  const loadUsers = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/users');
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
        const response = await fetch('http://localhost:3001/api/users/schema');
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormStatus('saving');
    try {
      const response = await fetch(
        editingId ? `http://localhost:3001/api/users/${editingId}` : 'http://localhost:3001/api/users',
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

  const handleEdit = (user) => {
    setEditingId(user[idColumn]);
    const nextData = editableColumns.reduce((acc, column) => {
      acc[column.name] = user[column.name] ?? '';
      return acc;
    }, {});
    setFormData(nextData);
    setFormStatus('');
  };

  const handleDelete = async (user) => {
    const userId = user[idColumn];
    if (!userId) {
      return;
    }
    try {
      const response = await fetch(`http://localhost:3001/api/users/${userId}`, {
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
                {editingId ? '수정 저장' : '등록'}
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
                    {Object.keys(users[0]).map((key) => (
                      <th key={key}>{key}</th>
                    ))}
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={user[idColumn] ?? index}>
                      {Object.values(user).map((value, valueIndex) => (
                        <td key={valueIndex}>{String(value)}</td>
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
    </>
  );
}

export default UsersPage;
