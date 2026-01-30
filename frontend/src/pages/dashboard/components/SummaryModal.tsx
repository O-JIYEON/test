import ReactApexChart from 'react-apexcharts';
import IconButton from '../../../components/common/IconButton';
import xIcon from '../../../assets/icon/x.svg';

type SummaryModalProps = {
  isOpen: boolean;
  departmentOptions: Array<string>;
  ownerOptions: Array<string>;
  summaryDepartment: string;
  summaryOwner: string;
  summaryTopCards: Array<any>;
  periodMode: string;
  summaryMonthlyData: Array<any>;
  summaryMonthlyOptions: any;
  summaryMonthlySeries: any;
  summaryStatusOptions: any;
  summaryStatusTrend: { categories: Array<any>; series: any };
  summaryUpcomingDeals: Array<any>;
  summaryLossReasons: Array<[string, number]>;
  summaryLossTotal: number;
  setSummaryDepartment: (value: string) => void;
  setSummaryOwner: (value: string) => void;
  setPeriodMode: (value: string) => void;
  openEditModal: (deal: any) => void;
  closeModal: () => void;
  formatDate: (value: any) => string;
};

function SummaryModal({
  isOpen,
  departmentOptions,
  ownerOptions,
  summaryDepartment,
  summaryOwner,
  summaryTopCards,
  periodMode,
  summaryMonthlyData,
  summaryMonthlyOptions,
  summaryMonthlySeries,
  summaryStatusOptions,
  summaryStatusTrend,
  summaryUpcomingDeals,
  summaryLossReasons,
  summaryLossTotal,
  setSummaryDepartment,
  setSummaryOwner,
  setPeriodMode,
  openEditModal,
  closeModal,
  formatDate
}: SummaryModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal dashboard-summary-modal__wrap">
      <div className="modal__overlay" onClick={closeModal} />
      <div className="modal__content modal__content--white dashboard-summary-modal" role="dialog" aria-modal="true">
        <div className="modal__header">
          <div className="modal__title-row modal__title-row--spaced">
            <h3>요약 상세</h3>
            <IconButton onClick={closeModal} aria-label="닫기">
              <img src={xIcon} alt="" aria-hidden="true" />
            </IconButton>
          </div>
        </div>
        <div className="modal__body dashboard-summary-modal__body">
          <div className="dashboard-summary-modal__left">
            <div className="dashboard-summary-modal__panel">
              <h4>부서 목록</h4>
              <div className="dashboard-summary-modal__list">
                {departmentOptions.length === 0 && <p className="table__status">데이터가 없습니다.</p>}
                {departmentOptions.map((dept) => (
                  <button
                    key={dept}
                    type="button"
                    className={`summary-chip${summaryDepartment === dept ? ' summary-chip--active' : ''}`}
                    onClick={() => {
                      setSummaryDepartment(dept);
                      setSummaryOwner('');
                    }}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>
            <div className="dashboard-summary-modal__panel">
              <h4>담당자 목록</h4>
              <div className="dashboard-summary-modal__list">
                {ownerOptions.length === 0 && <p className="table__status">데이터가 없습니다.</p>}
                {ownerOptions.map((owner) => (
                  <button
                    key={owner}
                    type="button"
                    className={`summary-chip${summaryOwner === owner ? ' summary-chip--active' : ''}`}
                    onClick={() => {
                      setSummaryOwner(owner);
                      setSummaryDepartment('');
                    }}
                  >
                    {owner}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="dashboard-summary-modal__right">
            <div className="dashboard__overview dashboard__overview--compact">
              <div className="dashboard__overview-cards dashboard__overview-cards--summary">
                {summaryTopCards.map((item) => (
                  <div className="dashboard__overview-card" key={item.label}>
                    <span>{item.label}</span>
                    <strong>
                      {item.value}
                      {item.delta && (
                        <em
                          className={`dashboard__overview-delta ${item.deltaClass || ''}`}
                          data-tooltip={item.deltaTooltip || ''}
                        >
                          {item.delta}
                        </em>
                      )}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
            <div className="dashboard-summary-modal__charts">
              <div className="dashboard-summary-modal__charts-header">
                <div />
                <div className="dashboard__period-toggle" data-active-index={periodMode === 'month' ? '1' : '0'}>
                  <button
                    type="button"
                    className={`dashboard__period-btn${periodMode === 'year' ? ' dashboard__period-btn--active' : ''}`}
                    onClick={() => setPeriodMode('year')}
                  >
                    연도별
                  </button>
                  <button
                    type="button"
                    className={`dashboard__period-btn${periodMode === 'month' ? ' dashboard__period-btn--active' : ''}`}
                    onClick={() => setPeriodMode('month')}
                  >
                    월별
                  </button>
                </div>
              </div>
              <div className="dashboard-summary-modal__row">
                <div className="dashboard__section">
                  <div className="dashboard__section-header">
                    <div className="dashboard__section-title">수주액</div>
                  </div>
                  <div className="dashboard__chart">
                    <div className="dashboard__chart-canvas">
                      {summaryMonthlyData.length === 0 ? (
                        <p className="table__status table__status--centered">데이터가 없습니다.</p>
                      ) : (
                        <ReactApexChart options={summaryMonthlyOptions} series={summaryMonthlySeries} type="line" height={220} />
                      )}
                    </div>
                  </div>
                </div>
                <div className="dashboard__section">
                  <div className="dashboard__section-title">상태별 건수</div>
                  <div className="dashboard__pipeline-stats-wrapper">
                    <div className="dashboard__pipeline-stats">
                      <div className="dashboard__pipeline-stats-chart">
                        {summaryStatusTrend.categories.length === 0 ? (
                          <p className="table__status table__status--centered">데이터가 없습니다.</p>
                        ) : (
                          <ReactApexChart options={summaryStatusOptions} series={summaryStatusTrend.series} type="bar" height={220} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div
              className={`dashboard-summary-modal__upcoming-grid${
                summaryLossReasons.length === 0 ? ' dashboard-summary-modal__upcoming-grid--full' : ''
              }`}
            >
              <div className="dashboard-summary-modal__upcoming">
                <div className="dashboard__section-title">다음액션 임박 딜</div>
                <div className="dashboard__table">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Deal ID</th>
                        <th>프로젝트명</th>
                        <th>회사명</th>
                        <th>담당자(영업)</th>
                        <th>다음액션내용</th>
                        <th>다음액션일</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summaryUpcomingDeals.length === 0 && (
                        <tr className="data-table__row data-table__row--empty">
                          <td colSpan={6} className="data-table__empty">데이터가 없습니다.</td>
                        </tr>
                      )}
                      {summaryUpcomingDeals.map((deal) => (
                        <tr
                          key={deal.id}
                          className="data-table__row"
                          onClick={() => {
                            openEditModal(deal);
                          }}
                        >
                          <td>{deal.deal_code || deal.id}</td>
                          <td>{deal.project_name || '-'}</td>
                          <td>{deal.company || '-'}</td>
                          <td>{deal.customer_owner || '-'}</td>
                          <td>{deal.next_action_content || '-'}</td>
                          <td>
                            {formatDate(deal.next_action_date) || '-'}
                            {deal.dday !== null && (
                              <span className="dashboard-summary-modal__upcoming-dday">
                                {deal.dday === 0
                                  ? ' (D-0)'
                                  : deal.dday > 0
                                    ? ` (D-${deal.dday})`
                                    : ` (D+${Math.abs(deal.dday)})`}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {summaryLossReasons.length > 0 && (
                <div className="dashboard-summary-modal__loss">
                  <div className="dashboard__section-title">실주 사유 Top 3</div>
                  <div className="dashboard-summary-modal__loss--card">
                    <div className="dashboard-summary-modal__loss-list">
                      {summaryLossReasons.map(([reason, count], index) => {
                        const percent = summaryLossTotal === 0 ? 0 : (count / summaryLossTotal) * 100;
                        return (
                          <div className="dashboard-summary-modal__loss-item" key={reason}>
                            <span className="dashboard-summary-modal__loss-rank">{index + 1}</span>
                            <span className="dashboard-summary-modal__loss-reason">{reason}</span>
                            <strong className="dashboard-summary-modal__loss-percent">{percent.toFixed(1)}%</strong>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SummaryModal;
