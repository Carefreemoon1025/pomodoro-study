import type { DashboardStats } from "../../../domain/stats";

export function Dashboard({ stats }: { stats: DashboardStats }) {
  const maxMinutes = Math.max(...stats.last7Days.map((day) => day.focusedMinutes), 1);

  return (
    <section className="dashboard" aria-label="专注统计">
      <div className="metric-row">
        <div className="metric">
          <span>今日专注</span>
          <strong>
            {stats.today.focusedMinutes}
            <small>分钟</small>
          </strong>
        </div>
        <div className="metric">
          <span>完成番茄</span>
          <strong>
            {stats.today.completedPomodoros}
            <small>个</small>
          </strong>
        </div>
        <div className="metric">
          <span>完成任务</span>
          <strong>
            {stats.today.completedTasks}
            <small>项</small>
          </strong>
        </div>
      </div>

      <div className="week-row">
        <div className="week-title">
          <strong>最近 7 天</strong>
          <span>专注分钟</span>
        </div>
        <div className="bars" aria-label="最近 7 天专注分钟">
          {stats.last7Days.map((day, index) => (
            <div className="bar-column" key={day.date}>
              <div className="bar-track">
                <div
                  className={`bar-fill ${index === stats.last7Days.length - 1 ? "is-today" : ""}`}
                  style={{
                    height: `${Math.max(
                      day.focusedMinutes === 0 ? 3 : 12,
                      (day.focusedMinutes / maxMinutes) * 100
                    )}%`
                  }}
                  title={`${day.date}：${day.focusedMinutes} 分钟`}
                />
              </div>
              <span>{index === stats.last7Days.length - 1 ? "今天" : day.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
