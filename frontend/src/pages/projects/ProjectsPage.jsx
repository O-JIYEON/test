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
              <input
                id="project-name"
                name="projectName"
                type="text"
                placeholder=" "
              />
              <span>프로젝트명</span>
            </label>
            <label className="project-form__field" htmlFor="project-period">
              <input
                id="project-period"
                name="projectPeriod"
                type="text"
                placeholder=" "
              />
              <span>기간</span>
            </label>
            <label className="project-form__field" htmlFor="project-description">
              <textarea
                id="project-description"
                name="projectDescription"
                rows="5"
                placeholder=" "
              />
              <span>설명</span>
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
