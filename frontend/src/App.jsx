const menuItems = Array.from({ length: 7 }, (_, index) => `메뉴 ${index + 1}`);

function App() {
  return (
    <div className="app">
      <aside className="sidebar">
        <h1 className="sidebar__title">영업 관리</h1>
        <nav className="sidebar__nav">
          <ul>
            {menuItems.map((item) => (
              <li key={item} className="sidebar__item">
                {item}
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="content">
        <header className="content__header">
          <h2>대시보드</h2>
          <p>메뉴를 선택하면 해당 영업 관리 내용을 이 영역에서 확인할 수 있습니다.</p>
        </header>
        <section className="content__section">
          <div className="content__card">
            <h3>오늘의 요약</h3>
            <p>신규 리드, 진행 중인 계약, 예정된 미팅을 한눈에 확인하세요.</p>
          </div>
          <div className="content__card">
            <h3>이번 주 목표</h3>
            <p>주간 매출 목표와 달성률을 관리하는 영역입니다.</p>
          </div>
          <div className="content__card">
            <h3>담당자 현황</h3>
            <p>팀별 담당자의 활동 및 성과를 확인할 수 있습니다.</p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
