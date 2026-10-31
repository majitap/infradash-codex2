import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Dialog, Status, Meter } from "./ui.jsx";
import {
  duration,
  timestamp,
  serviceStatus,
  nextIncidentState,
  setRecordStatus,
  makeRetry,
} from "./model.js";
const titleMap = {
  service: "서비스 상세",
  run: "파이프라인 상세",
  runner: "러너 상세",
  incident: "인시던트 상세",
  finding: "보안 검토",
};
const time = () =>
  new Date().toLocaleTimeString("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
export default function Details({
  type,
  item,
  runs,
  incidents,
  setRuns,
  setRunners,
  setIncidents,
  setFindings,
  onOpen,
  onClose,
  onRuns,
  notify,
}) {
  const [note, setNote] = useState("");
  const facts = {
    service: [
      ["담당 팀", item.group],
      ["담당자", item.owner],
      ["주 언어", item.language],
      ["저장 공간", `${item.storage} GB`],
    ],
    run: [
      ["프로젝트", item.service],
      ["브랜치", item.branch],
      ["실행자", item.author],
      ["시작 시각", timestamp(item.createdAt || "")],
    ],
    runner: [
      ["실행 방식", item.executor],
      ["위치", item.region],
      ["실행 슬롯", `${item.used} / ${item.slots}`],
      ["버전", item.version],
    ],
    incident: [
      ["영향 서비스", item.service],
      ["담당자", item.owner],
      ["심각도", item.severity],
      ["발생 시각", `${item.started} KST`],
    ],
    finding: [
      ["프로젝트", item.service],
      ["검사 도구", item.scanner],
      ["탐지 번호", item.id],
      ["환경", item.env],
    ],
  }[type];
  const heading = item.name || item.title;
  function updateIncident() {
    const next = nextIncidentState(item.status),
      message =
        next === "identified"
          ? "원인 확인 · 복구 작업 진행"
          : next === "resolved"
            ? "정상화 확인 · 이슈 해결"
            : "이슈 다시 열기";
    setIncidents((rows) =>
      setRecordStatus(rows, item.id, next, {
        timeline: [...item.timeline, [time(), message]],
      }),
    );
    notify("이슈 처리 상태를 변경했습니다.");
  }
  return (
    <Dialog title={titleMap[type]} label={heading} onClose={onClose} drawer>
      <div className="detail-body">
        <div className="detail-heading">
          <span className="detail-id">
            {type === "run"
              ? `#${item.id}`
              : type === "service"
                ? item.repo
                : item.id}
          </span>
          <h2>{heading}</h2>
          <Status
            value={
              type === "service" ? serviceStatus(item, incidents) : item.status
            }
          />
        </div>
        {item.description && (
          <p className="detail-description">{item.description}</p>
        )}
        <dl className="fact-list">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        {type === "service" && (
          <>
            <h3>서비스 지표</h3>
            <div className="service-readings">
              <div>
                <span>30일 가용성</span>
                <strong>
                  {item.uptime}
                  <small>%</small>
                </strong>
              </div>
              <div>
                <span>p95 응답 시간</span>
                <strong>
                  {item.latency}
                  <small>ms</small>
                </strong>
              </div>
            </div>
            <h3>최근 실행</h3>
            <div className="related-list">
              {runs
                .filter((r) => r.service === item.id)
                .slice(0, 3)
                .map((r) => (
                  <button key={r.id} onClick={() => onOpen("run", r)}>
                    <span>#{r.id}</span>
                    <Status value={r.status} />
                    <ChevronRight size={17} />
                  </button>
                ))}
            </div>
            <button className="button full" onClick={() => onRuns(item.id)}>
              이 서비스의 파이프라인 보기
            </button>
          </>
        )}
        {type === "run" && (
          <>
            <div className="run-duration">
              <span>소요 시간</span>
              <strong>{duration(item.duration)}</strong>
            </div>
            <h3>실행 단계</h3>
            <div className="stage-list">
              {["build", "test", "security", "deploy"].map((stage, i) => {
                const failedIndex = [
                    "build",
                    "test",
                    "security",
                    "deploy",
                  ].indexOf(item.failedStage),
                  status =
                    item.status === "success"
                      ? "success"
                      : item.status === "running"
                        ? i === 0
                          ? "success"
                          : i === 1
                            ? "running"
                            : "pending"
                        : i < failedIndex
                          ? "success"
                          : i === failedIndex
                            ? "failed"
                            : "pending";
                return (
                  <div key={stage}>
                    <span>{["빌드", "테스트", "보안 검사", "배포"][i]}</span>
                    {status === "pending" ? (
                      <span className="muted">대기</span>
                    ) : (
                      <Status value={status} />
                    )}
                  </div>
                );
              })}
            </div>
            <details className="log">
              <summary>작업 로그 보기</summary>
              <pre>
                {item.status === "failed"
                  ? `$ ${item.failedStage}\nError: demo job did not complete\nExit code: 1`
                  : item.status === "running"
                    ? "Build completed\nRunning tests..."
                    : "Build completed\nTests passed\nSecurity scan completed\nDeployment completed"}
              </pre>
            </details>
            <button
              className="button primary full"
              onClick={() => {
                if (item.status === "running") {
                  setRuns((rows) =>
                    setRecordStatus(rows, item.id, "success", {
                      duration: 213,
                    }),
                  );
                  notify("데모 실행이 성공으로 완료됐습니다.");
                } else {
                  const next = makeRetry(runs, item);
                  setRuns((rows) => [next, ...rows]);
                  onOpen("run", next);
                  notify(`데모 실행 #${next.id}를 시작했습니다.`);
                }
              }}
            >
              {item.status === "running"
                ? "데모 실행 완료"
                : "데모 파이프라인 재실행"}
            </button>
          </>
        )}
        {type === "runner" && (
          <>
            <h3>리소스 사용량</h3>
            <div className="resource-label">
              <span>CPU</span>
              <b>{item.cpu}%</b>
            </div>
            <Meter value={item.cpu} />
            <div className="resource-label">
              <span>메모리</span>
              <b>{item.memory}%</b>
            </div>
            <Meter value={item.memory} />
            <button
              className="button primary full"
              onClick={() => {
                const next = item.status === "online" ? "paused" : "online";
                setRunners((rows) =>
                  setRecordStatus(rows, item.id, next, {
                    used: 0,
                    cpu: next === "online" ? 12 : 0,
                    memory: next === "online" ? 24 : 14,
                  }),
                );
                notify(`${item.name} 상태를 변경했습니다.`);
              }}
            >
              {item.status === "online"
                ? "데모 러너 일시중지"
                : item.status === "offline"
                  ? "데모 러너 복구"
                  : "데모 러너 재개"}
            </button>
          </>
        )}
        {type === "incident" && (
          <>
            <h3>대응 기록</h3>
            <ol className="timeline">
              {item.timeline.map(([at, text], i) => (
                <li key={i}>
                  <time>{at}</time>
                  <p>{text}</p>
                </li>
              ))}
            </ol>
            <form
              className="note-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!note.trim()) return;
                setIncidents((rows) =>
                  rows.map((r) =>
                    r.id === item.id
                      ? {
                          ...r,
                          timeline: [...r.timeline, [time(), note.trim()]],
                        }
                      : r,
                  ),
                );
                setNote("");
                notify("브라우저에 대응 메모를 저장했습니다.");
              }}
            >
              <label htmlFor="incident-note">대응 메모</label>
              <textarea
                id="incident-note"
                value={note}
                maxLength={500}
                onChange={(e) => setNote(e.target.value)}
                placeholder="확인한 내용이나 다음 조치를 기록하세요."
              />
              <button className="button" disabled={!note.trim()}>
                메모 저장
              </button>
            </form>
            <button className="button primary full" onClick={updateIncident}>
              {item.status === "investigating"
                ? "원인 확인으로 변경"
                : item.status === "identified"
                  ? "해결 완료로 변경"
                  : "데모 이슈 다시 열기"}
            </button>
          </>
        )}
        {type === "finding" && (
          <>
            <h3>심각도</h3>
            <Status value={item.severity} />
            <h3>검토 순서</h3>
            <ol className="review-steps">
              <li>탐지의 정확성과 영향 범위를 확인합니다.</li>
              <li>수정 후 테스트와 검사를 실행합니다.</li>
              <li>검사 결과를 확인하고 처리합니다.</li>
            </ol>
            <button
              className="button primary full"
              onClick={() => {
                setFindings((rows) =>
                  setRecordStatus(
                    rows,
                    item.id,
                    item.status === "open" ? "resolved" : "open",
                  ),
                );
                notify("보안 검토 상태를 변경했습니다.");
              }}
            >
              {item.status === "open"
                ? "검토 완료 · 해결됨으로 변경"
                : "미해결로 다시 열기"}
            </button>
          </>
        )}
      </div>
      <footer className="detail-footer">
        데모 변경 사항은 이 브라우저에만 저장됩니다.
      </footer>
    </Dialog>
  );
}
