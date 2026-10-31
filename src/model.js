export const SNAPSHOT = "2026-10-31T16:40:00+09:00";
export const services = [
  {
    id: "core-api",
    name: "core-api",
    description: "서비스의 중심이 되는 핵심 API",
    group: "플랫폼",
    env: "production",
    owner: "김서준",
    language: "Go",
    latency: 86,
    uptime: 99.99,
    storage: 48.2,
    repo: "platform/core-api",
  },
  {
    id: "web-platform",
    name: "web-platform",
    description: "사용자와 만나는 웹 서비스",
    group: "프론트엔드",
    env: "production",
    owner: "이하은",
    language: "TypeScript",
    latency: 124,
    uptime: 99.99,
    storage: 35.8,
    repo: "product/web-platform",
  },
  {
    id: "billing-service",
    name: "billing-service",
    description: "결제 승인과 구독 정산",
    group: "커머스",
    env: "production",
    owner: "박지호",
    language: "Kotlin",
    latency: 342,
    uptime: 99.86,
    storage: 82.4,
    repo: "commerce/billing-service",
  },
  {
    id: "identity",
    name: "identity",
    description: "계정 인증과 접근 제어",
    group: "플랫폼",
    env: "production",
    owner: "최서연",
    language: "Java",
    latency: 62,
    uptime: 99.98,
    storage: 27.6,
    repo: "platform/identity",
  },
  {
    id: "data-platform",
    name: "data-platform",
    description: "분석 데이터 수집과 처리",
    group: "데이터",
    env: "staging",
    owner: "정도윤",
    language: "Python",
    latency: 210,
    uptime: 99.97,
    storage: 164.5,
    repo: "data/data-platform",
  },
  {
    id: "edge-gateway",
    name: "edge-gateway",
    description: "트래픽 라우팅과 요청 분산",
    group: "플랫폼",
    env: "staging",
    owner: "윤지안",
    language: "Go",
    latency: 24,
    uptime: 99.99,
    storage: 18.3,
    repo: "platform/edge-gateway",
  },
];
const commitTitles = [
  "요청 처리 성능 개선",
  "웹 접근성 및 탐색 개선",
  "결제 재시도 정책 보완",
  "인증 토큰 검증 개선",
  "데이터 변환 작업 최적화",
  "트래픽 라우팅 규칙 정리",
];
export const initialRuns = Array.from({ length: 168 }, (_, index) => {
  const day = Math.floor(index / 12),
    n = index % 12,
    service = services[n % 6],
    date = `2026-10-${String(31 - day).padStart(2, "0")}`;
  return {
    id: 11240 - index,
    service: service.id,
    env: service.env,
    title: commitTitles[n % 6],
    branch: n % 4 === 0 ? "feature/performance" : "main",
    commit: ["8f2a41c", "b3d91e7", "a5c87f0", "c9e41b2", "d3f90a6", "f2b61d8"][
      n % 6
    ],
    author: service.owner,
    status:
      index === 0 || index === 2
        ? "running"
        : index % 19 === 0 || index === 7
          ? "failed"
          : "success",
    duration: index === 0 || index === 2 ? 84 : 148 + ((index * 37) % 290),
    createdAt: `${date}T${String(16 - n).padStart(2, "0")}:25:00+09:00`,
    date,
    failedStage: index % 2 === 0 ? "test" : "deploy",
  };
});
export const initialRunners = [
  {
    id: "runner-01",
    name: "build-seoul-01",
    executor: "Docker",
    region: "서울 · zone A",
    env: "production",
    status: "online",
    cpu: 42,
    memory: 58,
    used: 3,
    slots: 8,
    version: "17.8.3",
  },
  {
    id: "runner-02",
    name: "build-seoul-02",
    executor: "Docker",
    region: "서울 · zone C",
    env: "production",
    status: "online",
    cpu: 64,
    memory: 46,
    used: 5,
    slots: 8,
    version: "17.8.3",
  },
  {
    id: "runner-03",
    name: "deploy-production",
    executor: "Shell",
    region: "서울 · zone A",
    env: "production",
    status: "online",
    cpu: 18,
    memory: 32,
    used: 1,
    slots: 4,
    version: "17.8.3",
  },
  {
    id: "runner-04",
    name: "shared-kubernetes",
    executor: "Kubernetes",
    region: "서울 · zone C",
    env: "production",
    status: "online",
    cpu: 53,
    memory: 67,
    used: 7,
    slots: 12,
    version: "17.8.3",
  },
  {
    id: "runner-05",
    name: "build-staging-01",
    executor: "Docker",
    region: "서울 · zone A",
    env: "staging",
    status: "online",
    cpu: 29,
    memory: 36,
    used: 2,
    slots: 6,
    version: "17.8.3",
  },
  {
    id: "runner-06",
    name: "e2e-browser",
    executor: "Docker",
    region: "서울 · zone C",
    env: "staging",
    status: "offline",
    cpu: 0,
    memory: 0,
    used: 0,
    slots: 4,
    version: "17.8.2",
  },
  {
    id: "runner-07",
    name: "macos-release",
    executor: "Shell",
    region: "온프레미스",
    env: "staging",
    status: "paused",
    cpu: 0,
    memory: 14,
    used: 0,
    slots: 2,
    version: "17.8.3",
  },
];
export const initialIncidents = [
  {
    id: "INC-042",
    title: "결제 승인 응답 지연",
    service: "billing-service",
    env: "production",
    severity: "S2",
    status: "investigating",
    owner: "박지호",
    started: "14:12",
    description:
      "결제 승인 응답이 평소보다 느립니다. 데이터베이스 연결 풀을 점검하고 있으며, 결제 요청은 재시도 정책에 따라 처리되고 있습니다.",
    timeline: [
      ["14:12", "응답 시간 임계치 초과로 이슈 감지"],
      ["14:18", "박지호 담당자 확인 · 원인 조사 시작"],
      ["15:30", "데이터베이스 연결 풀 점검 진행"],
    ],
  },
  {
    id: "INC-041",
    title: "스테이징 E2E 러너 연결 끊김",
    service: "data-platform",
    env: "staging",
    severity: "S3",
    status: "identified",
    owner: "정도윤",
    started: "13:05",
    description:
      "e2e-browser의 heartbeat가 멈췄습니다. 노드의 네트워크 설정 변경을 확인했고 복구를 준비하고 있습니다.",
    timeline: [
      ["13:05", "러너 heartbeat 응답 없음"],
      ["13:16", "네트워크 설정 변경 확인"],
    ],
  },
  {
    id: "INC-040",
    title: "API 캐시 적중률 일시 하락",
    service: "core-api",
    env: "production",
    severity: "S3",
    status: "resolved",
    owner: "김서준",
    started: "09:08",
    description: "배포 후 캐시가 다시 채워지며 정상화되었습니다.",
    timeline: [
      ["09:08", "캐시 적중률 하락 감지"],
      ["09:32", "캐시 정상화 확인"],
      ["09:40", "처리 완료"],
    ],
  },
];
export const initialFindings = [
  {
    id: "SEC-018",
    title: "컨테이너 이미지 보안 패치 검토",
    service: "billing-service",
    env: "production",
    severity: "critical",
    status: "open",
    scanner: "Container scanning",
    description:
      "예시 이미지에 대한 모의 탐지입니다. 운영 환경에서는 패치된 베이스 이미지로 빌드 후 다시 검사하세요.",
  },
  {
    id: "SEC-017",
    title: "의존성 패키지 업데이트 필요",
    service: "web-platform",
    env: "production",
    severity: "high",
    status: "open",
    scanner: "Dependency scanning",
    description:
      "모의 탐지입니다. 패키지 버전과 변경 사항을 검토하고 업데이트 후 테스트하세요.",
  },
  {
    id: "SEC-016",
    title: "입력 파라미터 검증 확인",
    service: "core-api",
    env: "production",
    severity: "medium",
    status: "open",
    scanner: "SAST",
    description:
      "모의 탐지입니다. 허용 문자와 최대 길이에 대한 검증 규칙을 확인하세요.",
  },
  {
    id: "SEC-015",
    title: "테스트 자격 증명 패턴 확인",
    service: "data-platform",
    env: "staging",
    severity: "high",
    status: "open",
    scanner: "Secret detection",
    description:
      "실제 비밀 키는 포함되어 있지 않습니다. 탐지 규칙과 검토 흐름을 위한 예시입니다.",
  },
  {
    id: "SEC-014",
    title: "보안 응답 헤더 검토",
    service: "identity",
    env: "production",
    severity: "low",
    status: "resolved",
    scanner: "DAST",
    description: "응답 헤더 설정을 검토하고 처리 완료한 예시입니다.",
  },
];
export function filterRecords(
  rows,
  { env = "all", status = "all", query = "", severity = "all" } = {},
) {
  const q = query.trim().toLowerCase();
  return rows.filter(
    (r) =>
      (env === "all" || r.env === env) &&
      (status === "all" || r.status === status) &&
      (severity === "all" || r.severity === severity) &&
      (!q ||
        [r.id, r.name, r.title, r.service, r.owner, r.author, r.group, r.branch]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)),
  );
}
export function recentRuns(rows, days = 7) {
  const start = `2026-10-${String(32 - days).padStart(2, "0")}`;
  return rows.filter((r) => r.date >= start && r.date <= "2026-10-31");
}
export function runStats(rows) {
  const completed = rows.filter((r) => r.status !== "running"),
    success = completed.filter((r) => r.status === "success").length;
  return {
    total: rows.length,
    success,
    failed: rows.filter((r) => r.status === "failed").length,
    running: rows.filter((r) => r.status === "running").length,
    rate: completed.length ? (success / completed.length) * 100 : null,
    average: completed.length
      ? Math.round(
          completed.reduce((a, r) => a + r.duration, 0) / completed.length,
        )
      : 0,
  };
}
export function dailySeries(rows, days = 7) {
  return Array.from({ length: days }, (_, i) => {
    const day = 32 - days + i,
      date = `2026-10-${String(day).padStart(2, "0")}`,
      stats = runStats(rows.filter((r) => r.date === date));
    return { ...stats, date, label: `10/${day}` };
  });
}
export function serviceStatus(service, incidents) {
  return incidents.some(
    (i) => i.service === service.id && i.status !== "resolved",
  )
    ? "attention"
    : "healthy";
}
export function duration(seconds) {
  return `${Math.floor(seconds / 60)}분 ${String(seconds % 60).padStart(2, "0")}초`;
}
export function timestamp(iso) {
  return `${iso.slice(5, 10).replace("-", "/")} ${iso.slice(11, 16)}`;
}
export function nextIncidentState(status) {
  return status === "investigating"
    ? "identified"
    : status === "identified"
      ? "resolved"
      : "investigating";
}
export function setRecordStatus(rows, id, status, extra = {}) {
  return rows.map((r) => (r.id === id ? { ...r, ...extra, status } : r));
}
export function makeRetry(rows, original) {
  const id = Math.max(0, ...rows.map((r) => r.id)) + 1;
  return {
    ...original,
    id,
    status: "running",
    duration: 0,
    createdAt: SNAPSHOT,
    date: SNAPSHOT.slice(0, 10),
  };
}
export function toCsv(rows, keys) {
  const quote = (value) =>
    '"' +
    String(value ?? "")
      .replace(/^(\s*)([=+@\-])/, "'$1$2")
      .replaceAll('"', '""') +
    '"';
  return (
    "\uFEFF" +
    [keys, ...rows.map((r) => keys.map((k) => r[k]))]
      .map((row) => row.map(quote).join(","))
      .join("\r\n")
  );
}
