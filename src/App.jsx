import React, { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  ChevronRight,
  LayoutGrid,
  Layers,
  Menu,
  Moon,
  Radio,
  Search,
  Server,
  Settings2,
  ShieldCheck,
  Sun,
  Workflow,
  X,
} from "lucide-react";
import {
  services,
  initialRuns,
  initialRunners,
  initialIncidents,
  initialFindings,
  filterRecords,
  recentRuns,
  runStats,
  serviceStatus,
  duration,
  timestamp,
  toCsv,
} from "./model.js";
import {
  Avatar,
  ButtonLink,
  Dialog,
  Empty,
  Meter,
  Paginated,
  Panel,
  SearchField,
  Status,
  Tabs,
  useLocal,
  labels,
} from "./ui.jsx";
import Trend from "./Trend.jsx";
import Details from "./Details.jsx";

const nav = [
  ["overview", "한눈에 보기", LayoutGrid],
  ["services", "서비스", Layers],
  ["pipelines", "파이프라인", Workflow],
  ["runners", "러너", Server],
  ["incidents", "인시던트", Radio],
  ["security", "보안", ShieldCheck],
];
const titles = {
  overview: "운영 현황",
  services: "서비스",
  pipelines: "파이프라인",
  runners: "러너",
  incidents: "인시던트",
  security: "보안",
  settings: "화면 설정",
};
const subtitles = {
  overview: "지금 중요한 것부터, 차분하게 살펴보세요.",
  services: "서비스의 상태와 담당 정보를 확인하세요.",
  pipelines: "코드가 배포되기까지의 실행 기록입니다.",
  runners: "작업을 실행하는 인프라의 여유를 확인하세요.",
  incidents: "상황을 공유하고, 해결까지 기록하세요.",
  security: "검토가 필요한 항목을 하나씩 확인하세요.",
  settings: "가장 편하게 읽히는 화면을 선택하세요.",
};
const route = () => {
  const key = location.hash.slice(1);
  return nav.some((n) => n[0] === key) || key === "settings" ? key : "overview";
};
const array = Array.isArray;

function RunsTable({ rows, onOpen }) {
  return rows.length ? (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>프로젝트 / 실행</th>
            <th>상태</th>
            <th>소요 시간</th>
            <th>시작 시각</th>
            <th aria-label="상세" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} onClick={() => onOpen("run", r)}>
              <td>
                <button
                  className="row-title"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen("run", r);
                  }}
                >
                  {r.service}
                </button>
                <span className="row-secondary">
                  #{r.id} · {r.title}
                </span>
              </td>
              <td>
                <Status value={r.status} />
              </td>
              <td className="numeric nowrap">{duration(r.duration)}</td>
              <td className="muted numeric nowrap">{timestamp(r.createdAt)}</td>
              <td>
                <ChevronRight size={18} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty />
  );
}

export default function App() {
  const [page, setPage] = useState(route),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState("all"),
    [severity, setSeverity] = useState("all"),
    [days, setDays] = useState(7),
    [securityTab, setSecurityTab] = useState("findings"),
    [incidentTab, setIncidentTab] = useState("active");
  const [runs, setRuns] = useLocal("runs", initialRuns, array),
    [runners, setRunners] = useLocal("runners", initialRunners, array),
    [incidents, setIncidents] = useLocal("incidents", initialIncidents, array),
    [findings, setFindings] = useLocal("findings", initialFindings, array),
    [checks, setChecks] = useLocal("checks", [], array);
  const [theme, setTheme] = useLocal("theme", "light", (v) =>
      ["light", "dark"].includes(v),
    ),
    [textSize, setTextSize] = useLocal("text-size", "comfortable", (v) =>
      ["comfortable", "large"].includes(v),
    ),
    [env, setEnv] = useLocal("environment", "all", (v) =>
      ["all", "production", "staging"].includes(v),
    );
  const [menuOpen, setMenuOpen] = useState(false),
    [searchOpen, setSearchOpen] = useState(false),
    [search, setSearch] = useState(""),
    [detail, setDetail] = useState(null),
    [resetOpen, setResetOpen] = useState(false),
    [toast, setToast] = useState(""),
    [mobile, setMobile] = useState(
      () => matchMedia("(max-width: 960px)").matches,
    );
  const pageRef = useRef(page),
    toastRef = useRef(null),
    menuButton = useRef(null),
    sidebarRef = useRef(null);
  const notify = (message) => {
    clearTimeout(toastRef.current);
    setToast(message);
    toastRef.current = setTimeout(() => setToast(""), 4200);
  };
  const clear = () => {
    setQuery("");
    setStatus("all");
    setSeverity("all");
  };
  function go(next) {
    pageRef.current = next;
    location.hash = next;
    setPage(next);
    setDetail(null);
    setSearchOpen(false);
    setMenuOpen(false);
    clear();
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function open(type, item) {
    setSearchOpen(false);
    setDetail({ type, id: item.id });
  }
  const scope = (rows) => filterRecords(rows, { env }),
    filter = (rows) =>
      filterRecords(rows, {
        env,
        status,
        query,
        severity: page === "security" ? severity : "all",
      });
  const serviceRows = scope(services),
    runRows = scope(runs),
    runnerRows = scope(runners),
    incidentRows = scope(incidents),
    findingRows = scope(findings),
    active = incidentRows.filter((i) => i.status !== "resolved"),
    periodRuns = recentRuns(runRows, days),
    stats = runStats(periodRuns);
  const healthy = serviceRows.filter(
      (s) => serviceStatus(s, incidents) === "healthy",
    ).length,
    online = runnerRows.filter((r) => r.status === "online").length,
    offline = runnerRows.filter((r) => r.status === "offline"),
    critical = findingRows.filter(
      (f) => f.status === "open" && f.severity === "critical",
    );
  const selected = detail
    ? (
        {
          service: services,
          run: runs,
          runner: runners,
          incident: incidents,
          finding: findings,
        }[detail.type] || []
      ).find((i) => i.id === detail.id)
    : null;
  const modalOpen = searchOpen || !!selected || resetOpen;
  const visibleIncidents = filter(incidents).filter(
    (i) =>
      incidentTab === "all" ||
      (incidentTab === "active"
        ? i.status !== "resolved"
        : i.status === "resolved"),
  );
  // Services derive their state from incident records rather than a duplicated status field.
  const filteredServices = filterRecords(services, { env, query }).filter(
    (s) => status === "all" || serviceStatus(s, incidents) === status,
  );
  useEffect(() => {
    const listener = () => {
      const next = route();
      if (next !== pageRef.current) {
        clear();
        setDetail(null);
        setMenuOpen(false);
      }
      pageRef.current = next;
      setPage(next);
    };
    window.addEventListener("hashchange", listener);
    return () => window.removeEventListener("hashchange", listener);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.textSize = textSize;
  }, [theme, textSize]);
  useEffect(() => {
    document.title = `${titles[page]} · InfraDash 2`;
  }, [page]);
  useEffect(() => {
    const media = matchMedia("(max-width: 960px)"),
      listener = (e) => {
        setMobile(e.matches);
        if (!e.matches) setMenuOpen(false);
      };
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);
  useEffect(() => {
    const listener = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setDetail(null);
        setResetOpen(false);
        setMenuOpen(false);
        setSearch("");
        setSearchOpen((s) => !s);
      }
      if (e.key === "Escape" && menuOpen) {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [menuOpen]);
  useEffect(() => {
    if (!menuOpen || !mobile) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() =>
      sidebarRef.current?.querySelector("a")?.focus(),
    );
    const trap = (e) => {
      if (e.key !== "Tab") return;
      const nodes = [...sidebarRef.current.querySelectorAll("a,button")];
      if (e.shiftKey && document.activeElement === nodes[0]) {
        e.preventDefault();
        nodes.at(-1).focus();
      } else if (!e.shiftKey && document.activeElement === nodes.at(-1)) {
        e.preventDefault();
        nodes[0].focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = before;
      document.removeEventListener("keydown", trap);
    };
  }, [menuOpen, mobile]);
  useEffect(() => () => clearTimeout(toastRef.current), []);
  const searchItems = [
    ...nav.map(([id, name]) => ({
      name,
      kind: "메뉴",
      secondary: "",
      action: () => go(id),
    })),
    ...scope(services).map((s) => ({
      name: s.name,
      kind: "서비스",
      secondary: s.description,
      action: () => open("service", s),
    })),
    ...scope(runners).map((r) => ({
      name: r.name,
      kind: "러너",
      secondary: labels[r.status],
      action: () => open("runner", r),
    })),
    ...scope(incidents).map((i) => ({
      name: i.title,
      kind: "인시던트",
      secondary: i.id,
      action: () => open("incident", i),
    })),
  ].filter((i) =>
    (i.name + " " + i.secondary).toLowerCase().includes(search.toLowerCase()),
  );
  function exportData() {
    const rows =
      {
        services: filteredServices,
        pipelines: filter(runs),
        runners: filter(runners),
        incidents: visibleIncidents,
        security: filter(findings),
      }[page] || [];
    const keys = rows.length
      ? Object.keys(rows[0]).filter(
          (k) => !["timeline", "description"].includes(k),
        )
      : ["id", "status"];
    const a = document.createElement("a"),
      url = URL.createObjectURL(
        new Blob([toCsv(rows, keys)], { type: "text/csv;charset=utf-8;" }),
      );
    a.href = url;
    a.download = `infradash2-${page}-${env}-2026-10-31.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify(`${rows.length}개 항목을 CSV로 저장했습니다.`);
  }
  const download = (
    <button className="button export-button" onClick={exportData}>
      <ArrowDownToLine size={18} />
      <span>CSV 저장</span>
    </button>
  );
  const statusSelect = (options) => (
    <select
      aria-label="상태 필터"
      value={status}
      onChange={(e) => setStatus(e.target.value)}
    >
      <option value="all">모든 상태</option>
      {options.map((s) => (
        <option key={s} value={s}>
          {labels[s]}
        </option>
      ))}
    </select>
  );
  const attentionItems = [
    ...active.slice(0, 1).map((i) => ({
      id: i.id,
      label: i.severity,
      title: i.title,
      description: `${i.service} · ${labels[i.status]}`,
      tone: "amber",
      action: () => open("incident", i),
    })),
    ...offline.slice(0, 1).map((r) => ({
      id: r.id,
      label: "러너",
      title: "연결이 끊긴 러너",
      description: r.name,
      tone: "muted",
      action: () => open("runner", r),
    })),
    ...critical.slice(0, 1).map((f) => ({
      id: f.id,
      label: "보안",
      title: "우선 검토할 보안 항목",
      description: f.service,
      tone: "red",
      action: () => open("finding", f),
    })),
  ];

  return (
    <>
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main").focus();
        }}
      >
        본문으로 건너뛰기
      </a>
      <div className="app" inert={modalOpen ? true : undefined}>
        {menuOpen && mobile && (
          <button
            className="sidebar-scrim"
            aria-label="메뉴 닫기"
            onClick={() => {
              setMenuOpen(false);
              menuButton.current?.focus();
            }}
          />
        )}
        <aside
          ref={sidebarRef}
          className={`sidebar ${menuOpen ? "open" : ""}`}
          role={mobile && menuOpen ? "dialog" : undefined}
          aria-modal={mobile && menuOpen ? true : undefined}
          aria-label={mobile && menuOpen ? "사이트 메뉴" : undefined}
        >
          <div className="brand-row">
            <a
              className="brand"
              href="#overview"
              onClick={(e) => {
                e.preventDefault();
                go("overview");
              }}
            >
              infradash<sup>2</sup>
            </a>
            {mobile && (
              <button
                className="icon-button"
                aria-label="메뉴 닫기"
                onClick={() => setMenuOpen(false)}
              >
                <X size={20} />
              </button>
            )}
          </div>
          <div className="workspace-label">
            Orbit 팀 <span>GitLab 운영</span>
          </div>
          <nav aria-label="주 메뉴">
            {nav.map(([id, label, Icon]) => (
              <a
                key={id}
                href={`#${id}`}
                aria-current={page === id ? "page" : undefined}
                className={`nav-item ${page === id ? "active" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  go(id);
                }}
              >
                <Icon size={20} strokeWidth={1.6} />
                <span>{label}</span>
                {id === "incidents" &&
                  incidents.some((i) => i.status !== "resolved") && (
                    <small>
                      {incidents.filter((i) => i.status !== "resolved").length}
                    </small>
                  )}
              </a>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="workspace-note">
              <span className="small-dot" />
              모의 데이터 환경<p>자유롭게 둘러보세요.</p>
            </div>
            <button
              className={`nav-item ${page === "settings" ? "active" : ""}`}
              onClick={() => go("settings")}
            >
              <Settings2 size={20} strokeWidth={1.6} />
              화면 설정
            </button>
            <div className="sidebar-user">
              <Avatar name="김서준" />
              <div>
                <strong>김서준</strong>
                <span>데모 관리자</span>
              </div>
              <button
                className="icon-button"
                aria-label={
                  theme === "light" ? "다크 모드로 변경" : "라이트 모드로 변경"
                }
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              >
                {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
              </button>
            </div>
          </div>
        </aside>
        <div
          className="workspace"
          inert={menuOpen && mobile ? true : undefined}
        >
          <header className="topbar">
            <button
              ref={menuButton}
              className="icon-button menu-button"
              aria-label="메뉴 열기"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={22} />
            </button>
            <div className="breadcrumb">
              <span>워크스페이스</span>
              <ChevronRight size={15} />
              <strong>{titles[page]}</strong>
            </div>
            <div className="topbar-actions">
              <button
                className="global-search"
                aria-label="빠른 검색 열기"
                onClick={() => {
                  setSearch("");
                  setSearchOpen(true);
                }}
              >
                <Search size={19} />
                <span>검색하거나 이동하기</span>
                <kbd>Ctrl K</kbd>
              </button>
              <button
                className="reading-button"
                aria-label="글자 크기 설정"
                onClick={() => go("settings")}
              >
                Aa
              </button>
            </div>
          </header>
          <main id="main" tabIndex={-1}>
            <div className="page-heading">
              <div>
                <h1>{titles[page]}</h1>
                <p>{subtitles[page]}</p>
              </div>
              {page !== "settings" && (
                <div className="environment">
                  <span
                    className={`environment-dot ${env === "staging" ? "staging" : ""}`}
                  />
                  <select
                    aria-label="환경 선택"
                    value={env}
                    onChange={(e) => {
                      setEnv(e.target.value);
                      clear();
                    }}
                  >
                    <option value="all">전체 환경</option>
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                  </select>
                </div>
              )}
            </div>

            {page === "overview" && (
              <>
                <div className="overview-meta">
                  <span>
                    2026년 10월 31일 토요일 <i>·</i> 16:40 KST
                  </span>
                  <span className="demo-label">인터랙티브 데모</span>
                </div>
                <section className="summary" aria-label="주요 운영 지표">
                  <button onClick={() => go("services")}>
                    <span>정상 운영 서비스</span>
                    <strong>
                      {healthy}
                      <small>/ {serviceRows.length}</small>
                    </strong>
                    <p>
                      {healthy === serviceRows.length
                        ? "모든 서비스가 정상입니다"
                        : `${serviceRows.length - healthy}개 서비스 확인 필요`}
                    </p>
                  </button>
                  <button onClick={() => go("pipelines")}>
                    <span>파이프라인 성공률</span>
                    <strong>
                      {stats.rate?.toFixed(1) ?? "—"}
                      <small>%</small>
                    </strong>
                    <p>최근 {days}일 · 완료된 실행 기준</p>
                  </button>
                  <button onClick={() => go("runners")}>
                    <span>사용 가능한 러너</span>
                    <strong>
                      {online}
                      <small>/ {runnerRows.length}</small>
                    </strong>
                    <p>
                      {runnerRows.filter((r) => r.status === "offline").length}
                      대 오프라인 ·{" "}
                      {runnerRows.filter((r) => r.status === "paused").length}대
                      일시중지
                    </p>
                  </button>
                </section>
                <div className="overview-columns">
                  <Trend runs={periodRuns} days={days} onDays={setDays} />
                  <Panel
                    title="지금 확인할 일"
                    description="먼저 살펴보면 좋은 항목입니다."
                    className="attention-panel"
                  >
                    <div className="attention-list">
                      {attentionItems.map((i) => (
                        <button key={i.id} onClick={i.action}>
                          <div>
                            <span className={`attention-category ${i.tone}`}>
                              <i />
                              {i.label}
                            </span>
                            <h3>{i.title}</h3>
                            <p>{i.description}</p>
                          </div>
                          <ArrowRight size={19} />
                        </button>
                      ))}
                      {!attentionItems.length && (
                        <Empty title="확인할 일이 없어요.">
                          현재 환경의 주요 항목이 정리되었습니다.
                        </Empty>
                      )}
                    </div>
                    <div className="attention-footer">
                      <span>진행 중인 인시던트 {active.length}건</span>
                      <ButtonLink onClick={() => go("incidents")}>
                        이슈 보기
                      </ButtonLink>
                    </div>
                  </Panel>
                </div>
              </>
            )}

            {page === "services" && (
              <>
                <div className="page-toolbar">
                  <SearchField
                    value={query}
                    onChange={setQuery}
                    placeholder="서비스나 담당자 검색"
                  />
                  <div className="toolbar-right">
                    {statusSelect(["healthy", "attention"])}
                    {download}
                  </div>
                </div>
                <div className="service-grid">
                  {filteredServices.map((s) => (
                    <button
                      key={s.id}
                      className="service-card"
                      onClick={() => open("service", s)}
                    >
                      <header>
                        <span>{s.group}</span>
                        <Status value={serviceStatus(s, incidents)} />
                      </header>
                      <h2>{s.name}</h2>
                      <p>{s.description}</p>
                      <div className="service-card-readings">
                        <span>
                          p95 응답 시간
                          <strong>
                            {s.latency}
                            <small>ms</small>
                          </strong>
                        </span>
                        <span>
                          30일 가용성
                          <strong>
                            {s.uptime}
                            <small>%</small>
                          </strong>
                        </span>
                      </div>
                      <footer>
                        <span>
                          <Avatar name={s.owner} />
                          {s.owner}
                        </span>
                        <span>
                          서비스 상세
                          <ChevronRight size={17} />
                        </span>
                      </footer>
                    </button>
                  ))}
                </div>
                {!filteredServices.length && <Empty />}
              </>
            )}

            {page === "pipelines" && (
              <Panel
                title="최근 실행"
                description={`${runRows.length}회 실행 · 실행 기록은 14일간의 모의 데이터입니다.`}
                action={download}
              >
                <div className="table-toolbar">
                  <Tabs
                    label="파이프라인 상태"
                    value={status}
                    onChange={setStatus}
                    options={[
                      ["all", "전체"],
                      ["running", "실행 중"],
                      ["failed", "실패"],
                      ["success", "성공"],
                    ]}
                  />
                  <SearchField
                    value={query}
                    onChange={setQuery}
                    placeholder="프로젝트, 브랜치, 번호 검색"
                  />
                </div>
                <Paginated rows={filter(runs)}>
                  {(rows) => <RunsTable rows={rows} onOpen={open} />}
                </Paginated>
              </Panel>
            )}

            {page === "runners" && (
              <>
                <div className="page-toolbar">
                  <SearchField
                    value={query}
                    onChange={setQuery}
                    placeholder="러너 이름 검색"
                  />
                  {statusSelect(["online", "offline", "paused"])}
                </div>
                <div className="runner-grid">
                  {filter(runners).map((r) => (
                    <button
                      className="runner-card"
                      key={r.id}
                      onClick={() => open("runner", r)}
                    >
                      <header>
                        <h2>{r.name}</h2>
                        <Status value={r.status} />
                      </header>
                      <p>
                        {r.executor} <i>·</i> {r.region}
                      </p>
                      <div className="runner-resources">
                        <div>
                          <div className="resource-label">
                            <span>CPU</span>
                            <b>{r.cpu}%</b>
                          </div>
                          <Meter value={r.cpu} />
                        </div>
                        <div>
                          <div className="resource-label">
                            <span>메모리</span>
                            <b>{r.memory}%</b>
                          </div>
                          <Meter value={r.memory} />
                        </div>
                      </div>
                      <footer>
                        <span>
                          {r.used} / {r.slots} 슬롯 사용
                        </span>
                        <span>
                          상세 보기
                          <ChevronRight size={17} />
                        </span>
                      </footer>
                    </button>
                  ))}
                </div>
                {!filter(runners).length && <Empty />}
              </>
            )}

            {page === "incidents" && (
              <Panel
                title="이슈 목록"
                description="오늘의 온콜 · 박지호"
                action={download}
              >
                <div className="table-toolbar">
                  <Tabs
                    label="인시던트 보기"
                    value={incidentTab}
                    onChange={setIncidentTab}
                    options={[
                      ["active", `진행 중 ${active.length}`],
                      ["resolved", "해결됨"],
                      ["all", "전체"],
                    ]}
                  />
                  <SearchField
                    value={query}
                    onChange={setQuery}
                    placeholder="제목, 서비스, 담당자 검색"
                  />
                </div>
                <div className="incident-list">
                  {visibleIncidents.map((i) => (
                    <button key={i.id} onClick={() => open("incident", i)}>
                      <span className="incident-severity">{i.severity}</span>
                      <div>
                        <h3>{i.title}</h3>
                        <p>
                          {i.id} · {i.service} · {i.started} 발생
                        </p>
                      </div>
                      <Status value={i.status} />
                      <span className="incident-owner">
                        <Avatar name={i.owner} />
                        {i.owner}
                      </span>
                      <ChevronRight size={18} />
                    </button>
                  ))}
                </div>
                {!visibleIncidents.length && (
                  <Empty title="표시할 이슈가 없어요.">
                    다른 상태를 선택해 기록을 확인할 수 있습니다.
                  </Empty>
                )}
              </Panel>
            )}

            {page === "security" && (
              <>
                <div className="section-tabs">
                  <button
                    aria-pressed={securityTab === "findings"}
                    className={securityTab === "findings" ? "active" : ""}
                    onClick={() => setSecurityTab("findings")}
                  >
                    보안 탐지
                    <span>
                      {findingRows.filter((f) => f.status === "open").length}
                    </span>
                  </button>
                  <button
                    aria-pressed={securityTab === "checks"}
                    className={securityTab === "checks" ? "active" : ""}
                    onClick={() => setSecurityTab("checks")}
                  >
                    배포 전 점검
                  </button>
                </div>
                {securityTab === "findings" ? (
                  <Panel
                    title="검토할 항목"
                    description="실제 취약점이나 비밀 키가 포함되지 않은 예시입니다."
                    action={download}
                  >
                    <div className="table-toolbar security-toolbar">
                      <SearchField
                        value={query}
                        onChange={setQuery}
                        placeholder="제목 또는 프로젝트 검색"
                      />
                      <div className="toolbar-right">
                        <select
                          aria-label="심각도 필터"
                          value={severity}
                          onChange={(e) => setSeverity(e.target.value)}
                        >
                          <option value="all">모든 심각도</option>
                          {["critical", "high", "medium", "low"].map((s) => (
                            <option value={s} key={s}>
                              {labels[s]}
                            </option>
                          ))}
                        </select>
                        {statusSelect(["open", "resolved"])}
                      </div>
                    </div>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>탐지 내용</th>
                            <th>심각도</th>
                            <th>검토 상태</th>
                            <th aria-label="상세" />
                          </tr>
                        </thead>
                        <tbody>
                          {filter(findings).map((f) => (
                            <tr key={f.id} onClick={() => open("finding", f)}>
                              <td>
                                <button
                                  className="row-title"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    open("finding", f);
                                  }}
                                >
                                  {f.title}
                                </button>
                                <span className="row-secondary">
                                  {f.service} · {f.scanner}
                                </span>
                              </td>
                              <td>
                                <Status value={f.severity} />
                              </td>
                              <td>
                                <Status value={f.status} />
                              </td>
                              <td>
                                <ChevronRight size={18} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {!filter(findings).length && <Empty />}
                    </div>
                  </Panel>
                ) : (
                  <Panel
                    title="배포 전 점검"
                    description={`${checks.length} / 4개 확인 완료`}
                  >
                    <div className="checklist">
                      {[
                        "기본 브랜치 보호와 코드 리뷰 규칙 확인",
                        "관리자 계정의 2단계 인증 확인",
                        "미해결 보안 탐지 결과 검토",
                        "백업 복원 절차와 최근 실행 결과 확인",
                      ].map((text, i) => (
                        <label key={text}>
                          <input
                            type="checkbox"
                            checked={checks.includes(i)}
                            onChange={(e) =>
                              setChecks((rows) =>
                                e.target.checked
                                  ? [...rows, i]
                                  : rows.filter((n) => n !== i),
                              )
                            }
                          />
                          <span>{text}</span>
                        </label>
                      ))}
                    </div>
                  </Panel>
                )}
              </>
            )}

            {page === "settings" && (
              <>
                <Panel title="읽기 편한 화면">
                  <div className="settings-rows">
                    <div>
                      <div>
                        <h3>글자 크기</h3>
                        <p>모든 메뉴와 본문 크기를 함께 조정합니다.</p>
                      </div>
                      <Tabs
                        label="글자 크기"
                        value={textSize}
                        onChange={setTextSize}
                        options={[
                          ["comfortable", "넉넉하게"],
                          ["large", "더 크게"],
                        ]}
                      />
                    </div>
                    <div>
                      <div>
                        <h3>화면 테마</h3>
                        <p>편안하게 읽히는 배경을 선택하세요.</p>
                      </div>
                      <Tabs
                        label="화면 테마"
                        value={theme}
                        onChange={setTheme}
                        options={[
                          ["light", "밝게"],
                          ["dark", "어둡게"],
                        ]}
                      />
                    </div>
                  </div>
                </Panel>
                <Panel title="데모 데이터">
                  <div className="settings-content">
                    <p>
                      이 사이트는 독립적인 GitLab 운영 데모입니다. 실제 서버에
                      연결하지 않으며, 변경한 내용은 현재 브라우저에만
                      저장됩니다.
                    </p>
                    <button
                      className="button"
                      onClick={() => setResetOpen(true)}
                    >
                      데모 데이터 초기화
                    </button>
                  </div>
                </Panel>
                <div className="source-link">
                  <a
                    href="https://github.com/majitap/infradash-codex2"
                    target="_blank"
                    rel="noreferrer"
                  >
                    소스 코드 보기
                    <ArrowRight size={17} />
                  </a>
                </div>
              </>
            )}

            <footer className="page-footer">
              <span>
                InfraDash 2 <i>·</i> 모의 데이터로 살펴보는 GitLab 운영
              </span>
              <span>실제 시스템에 영향을 주지 않습니다.</span>
            </footer>
          </main>
        </div>
      </div>
      {toast && (
        <div className="toast" role="status">
          <span>{toast}</span>
          <button aria-label="메시지 닫기" onClick={() => setToast("")}>
            <X size={17} />
          </button>
        </div>
      )}
      {selected && (
        <Details
          key={`${detail.type}-${detail.id}`}
          type={detail.type}
          item={selected}
          runs={runs}
          incidents={incidents}
          setRuns={setRuns}
          setRunners={setRunners}
          setIncidents={setIncidents}
          setFindings={setFindings}
          onOpen={open}
          onClose={() => setDetail(null)}
          onRuns={(service) => {
            go("pipelines");
            setQuery(service);
          }}
          notify={notify}
        />
      )}
      {searchOpen && (
        <Dialog
          title="빠른 검색"
          onClose={() => setSearchOpen(false)}
          initialFocus="input"
        >
          <div className="command-input">
            <Search size={22} />
            <input
              aria-label="빠른 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="메뉴, 서비스, 러너 검색"
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchItems.length)
                  searchItems[0].action();
              }}
            />
          </div>
          <div className="search-results">
            <p>{search ? "검색 결과" : "바로 이동"}</p>
            {searchItems.slice(0, 15).map((i, n) => (
              <button key={`${i.kind}-${n}`} onClick={i.action}>
                <div>
                  <strong>{i.name}</strong>
                  {i.secondary && <span>{i.secondary}</span>}
                </div>
                <small>{i.kind}</small>
                <ChevronRight size={18} />
              </button>
            ))}
            {!searchItems.length && <Empty />}
          </div>
          <div className="command-footer">
            Tab으로 이동 · Enter로 열기 · Esc로 닫기
          </div>
        </Dialog>
      )}
      {resetOpen && (
        <Dialog title="데모 데이터 초기화" onClose={() => setResetOpen(false)}>
          <div className="reset-body">
            <h2>처음 상태로 되돌릴까요?</h2>
            <p>
              이 사이트에서 변경한 실행 기록, 이슈 대응 기록과 검토 상태가 초기
              예시 데이터로 돌아갑니다.
            </p>
            <div>
              <button className="button" onClick={() => setResetOpen(false)}>
                취소
              </button>
              <button
                className="button primary"
                onClick={() => {
                  setRuns(initialRuns);
                  setRunners(initialRunners);
                  setIncidents(initialIncidents);
                  setFindings(initialFindings);
                  setChecks([]);
                  setResetOpen(false);
                  notify("데모 데이터를 초기화했습니다.");
                }}
              >
                초기화
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}
