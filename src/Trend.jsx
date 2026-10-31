import React, { useState } from "react";
import { dailySeries, runStats } from "./model.js";
import { Panel, Tabs } from "./ui.jsx";
export default function Trend({ runs, days, onDays }) {
  const data = dailySeries(runs, days),
    stats = runStats(runs),
    [active, setActive] = useState(null),
    width = 700,
    height = 180;
  const y = (rate) =>
    Math.min(176, Math.max(4, ((100 - (rate ?? 70)) / 30) * 172 + 4));
  const points = data.map((d, i) => [(i / (days - 1)) * width, y(d.rate)]),
    line = points.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" "),
    area = `${line} L${width},${height} L0,${height} Z`;
  return (
    <Panel
      title="파이프라인 성공률"
      description={`성공 ${stats.success}회 · 실패 ${stats.failed}회 · 실행 중 ${stats.running}회`}
      action={
        <Tabs
          label="추이 기간"
          value={days}
          onChange={(d) => {
            onDays(d);
            setActive(null);
          }}
          options={[
            [7, "7일"],
            [14, "14일"],
          ]}
        />
      }
      className="trend-panel"
    >
      <div className="trend-chart">
        <div className="trend-axis" aria-hidden="true">
          {[100, 90, 80, 70].map((v) => (
            <span key={v}>{v}%</span>
          ))}
        </div>
        <div className="trend-plot">
          <div className="trend-grid" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <i key={i} />
            ))}
          </div>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            role="img"
            aria-label={`최근 ${days}일 일별 완료 파이프라인 성공률`}
          >
            <path d={area} className="trend-area" />
            <path d={line} className="trend-line" />
          </svg>
          <div className="trend-dots">
            {data.map((d, i) => (
              <button
                key={d.date}
                style={{
                  left: `${(i / (days - 1)) * 100}%`,
                  top: `${(y(d.rate) / height) * 100}%`,
                }}
                aria-label={`${d.label} 성공률 ${d.rate == null ? "데이터 없음" : `${d.rate.toFixed(1)}%`}, 성공 ${d.success}회, 실패 ${d.failed}회`}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                onClick={() => setActive(active === i ? null : i)}
              >
                <span
                  className={active === i || i === days - 1 ? "visible" : ""}
                />
              </button>
            ))}
          </div>
          {active != null && (
            <div
              className="trend-tooltip"
              style={{
                left: `${Math.min(66, Math.max(1, (active / (days - 1)) * 90 - 12))}%`,
              }}
            >
              <b>
                {data[active].label} · {data[active].rate?.toFixed(1) ?? "—"}%
              </b>
              <span>
                성공 {data[active].success} · 실패 {data[active].failed}
              </span>
            </div>
          )}
        </div>
        <div className="trend-dates" aria-hidden="true">
          {data.map((d, i) => (
            <span key={d.date} style={{ left: `${(i / (days - 1)) * 100}%` }}>
              {days === 7 ||
              i === 0 ||
              i === days - 1 ||
              (i % 3 === 0 && i < days - 3)
                ? d.label
                : ""}
            </span>
          ))}
        </div>
      </div>
      <div className="trend-caption">
        <span>
          <i />
          완료된 실행 기준
        </span>
        <span>10/{32 - days}–10/31</span>
      </div>
    </Panel>
  );
}
