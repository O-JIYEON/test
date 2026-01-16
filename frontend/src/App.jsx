import { NavLink, Navigate, Route, Routes } from 'react-router-dom';

const menuItems = [
  { label: '대시보드', path: '/dashboard' },
  { label: '프로젝트 관리', path: '/projects' },
  { label: '영업', path: '/sales' },
  { label: '기간1', path: '/period-1' },
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
          {menuItems.map((item) =>
            item.path === '/projects' ? (
              <Route key={item.path} path={item.path} element={<ProjectsPage />} />
            ) : (
              <Route key={item.path} path={item.path} element={<MenuPage title={item.label} />} />
            )
          )}
        </Routes>
      </main>
    </div>
  );
}

export default App;
