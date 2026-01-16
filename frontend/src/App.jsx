import { useEffect, useState } from 'react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';

const menuItems = [
  { label: '대시보드', path: '/dashboard' },
  { label: '프로젝트 관리', path: '/projects' },
  { label: '영업', path: '/sales' },
  { label: '사용자', path: '/period-1' },
  { label: '기간2', path: '/period-2' },
  { label: '기간3', path: '/period-3' },
  { label: '설정', path: '/settings' },
];

function MenuPage({ title }) {
  return (
    <>
      <header className="content__header">
        <h2>{title}</h2>
        <p>현재 보고 있는 화면은 {title} 입니다.</p>
      </header>
      <section className="content__section">
        <div className="content__card">
          <h3>{title} 개요</h3>
          <p>{title} 관련 주요 정보를 이곳에서 확인할 수 있습니다.</p>
        </div>
        <div className="content__card">
          <h3>{title} 진행 현황</h3>
          <p>{title}에서 진행 중인 항목을 빠르게 살펴보세요.</p>
        </div>
        <div className="content__card">
          <h3>{title} 관리</h3>
          <p>{title} 화면의 설정과 관리 도구를 확인하세요.</p>
        </div>
      </section>
    </>
  );
}

function ProjectsPage() {
  return (
    <>
      <header className="content__header">
        <h2>프로젝트 관리</h2>
        <p>새 프로젝트를 등록하고 기본 정보를 설정하세요.</p>
      </header>
      <section className="content__section content__section--single">
        <div className="content__card content__card--form">
          <h3>프로젝트 등록</h3>
          <form className="project-form">
            <label className="project-form__field" htmlFor="project-name">
              <span>프로젝트명</span>
              <input
                id="project-name"
                name="projectName"
                type="text"
                placeholder="프로젝트 이름을 입력하세요"
              />
            </label>
            <label className="project-form__field" htmlFor="project-period">
              <span>기간</span>
              <input
                id="project-period"
                name="projectPeriod"
                type="text"
                placeholder="예: 2024-01-01 ~ 2024-12-31"
              />
            </label>
            <label className="project-form__field" htmlFor="project-description">
              <span>설명</span>
              <textarea
                id="project-description"
                name="projectDescription"
                rows="5"
                placeholder="프로젝트 설명을 입력하세요"
              />
            </label>
            <button className="project-form__submit" type="button">
              등록
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

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
                <span>{column.name}</span>
                <input
                  id={`user-${column.name}`}
                  name={column.name}
                  type="text"
                  value={formData[column.name] ?? ''}
                  onChange={(event) => handleChange(column.name, event.target.value)}
                  placeholder={`${column.name} 값을 입력하세요`}
                />
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

function App() {
  return (
    <div className="app">
      <aside className="sidebar">
        <h1 className="sidebar__title">메뉴</h1>
        <nav className="sidebar__nav">
          <ul>
            {menuItems.map((item) => (
              <li key={item.path} className="sidebar__item">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          {menuItems.map((item) => {
            if (item.path === '/projects') {
              return <Route key={item.path} path={item.path} element={<ProjectsPage />} />;
            }
            if (item.path === '/period-1') {
              return <Route key={item.path} path={item.path} element={<UsersPage />} />;
            }
            return (
              <Route key={item.path} path={item.path} element={<MenuPage title={item.label} />} />
            );
          })}
        </Routes>
      </main>
    </div>
  );
}

export default App;
