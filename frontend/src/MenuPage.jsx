function MenuPage({ title }) {
  return (
    <div className="content__page">
      <header className="content__header">
        <h2>{title}</h2>
        <p>{title} 화면입니다. 좌측 메뉴에서 다른 섹션으로 이동할 수 있습니다.</p>
      </header>
      <section className="content__section">
        <div className="content__card">
          <h3>{title} 요약</h3>
          <p>{title}와 관련된 지표와 알림을 이곳에서 확인하세요.</p>
        </div>
        <div className="content__card">
          <h3>{title} 현황</h3>
          <p>주요 진행 상황과 담당자별 업데이트를 확인합니다.</p>
        </div>
        <div className="content__card">
          <h3>{title} 메모</h3>
          <p>협업 메모나 다음 액션 아이템을 기록하는 영역입니다.</p>
        </div>
      </section>
    </div>
  );
}

export default MenuPage;
