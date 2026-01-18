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

export default MenuPage;
