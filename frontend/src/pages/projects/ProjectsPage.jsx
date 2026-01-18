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

export default ProjectsPage;
