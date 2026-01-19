function DashboardPage() {
  return (
    <>
      <section className="content__section content__section--single">
        <div className="content__card content__card--wide">
          <form className="filter-form">
            <div className="filter-form__fields">
              <label className="project-form__field" htmlFor="filter-start-date">
                <input
                  id="filter-start-date"
                  name="startDate"
                  type="date"
                  data-filled="false"
                  onChange={(event) => {
                    event.target.dataset.filled = event.target.value ? 'true' : 'false';
                  }}
                />
                <span>기간 시작</span>
              </label>
              <label className="project-form__field" htmlFor="filter-end-date">
                <input
                  id="filter-end-date"
                  name="endDate"
                  type="date"
                  data-filled="false"
                  onChange={(event) => {
                    event.target.dataset.filled = event.target.value ? 'true' : 'false';
                  }}
                />
                <span>기간 종료</span>
              </label>
              <label className="project-form__field" htmlFor="filter-owner">
                <input id="filter-owner" name="owner" type="text" placeholder=" " />
                <span>담당자</span>
              </label>
              <label className="project-form__field" htmlFor="filter-source">
                <input id="filter-source" name="source" type="text" placeholder=" " />
                <span>소스</span>
              </label>
              <label className="project-form__field" htmlFor="filter-product">
                <input id="filter-product" name="productLine" type="text" placeholder=" " />
                <span>제품라인</span>
              </label>
              <label className="project-form__field" htmlFor="filter-region">
                <input id="filter-region" name="region" type="text" placeholder=" " />
                <span>지역</span>
              </label>
              <label className="project-form__field" htmlFor="filter-segment">
                <input id="filter-segment" name="segment" type="text" placeholder=" " />
                <span>세그먼트</span>
              </label>
              <label className="project-form__field" htmlFor="filter-goal">
                <input id="filter-goal" name="monthlyGoal" type="number" placeholder=" " />
                <span>이번달 목표매출</span>
              </label>
            </div>
            <div className="form-actions">
              <button className="project-form__submit" type="button">
                검색
              </button>
              <button className="form-actions__reset" type="reset">
                초기화
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}

export default DashboardPage;
