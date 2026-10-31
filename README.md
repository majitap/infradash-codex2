# InfraDash 2

**https://majitap.github.io/infradash-codex2/**

크고 편안하게 읽는 GitLab 운영 워크스페이스입니다. 기존 InfraDash Codex는 참고만 하고 화면 구성, 컴포넌트, 데이터 모델을 별도로 작성했습니다.

## 화면 설계

- 기본 글자 17px, 큰 글자 19px. 브라우저의 기본 글자 크기를 따르는 상대 단위 사용.
- 메뉴, 본문, 상세 패널의 크기와 행간을 함께 조정하는 화면 설정.
- 밝은 뉴트럴 톤과 차분한 파란색. 장식용 아이콘 박스 없이 텍스트와 여백으로 정보 구분.
- 개요에는 주요 지표, 일별 성공률, 우선 확인할 항목만 표시.
- Geist와 Noto Sans KR 가변 폰트를 사이트에 포함. 외부 폰트 CDN에 연결하지 않음.
- 모바일 메뉴, 키보드 탐색, 모달 초점 관리, 모션 감소 설정 지원.

타이포그래피를 정리할 때 [Atlassian Typography](https://atlassian.design/foundations/typography)와 [Geist Typography](https://vercel.com/geist/typography)의 지침을 참고했습니다.

## 기능

| 메뉴        | 기능                                                                        |
| ----------- | --------------------------------------------------------------------------- |
| 한눈에 보기 | 환경별 지표, 7일·14일 성공률 추이, 인시던트·러너·보안 우선 확인 항목        |
| 서비스      | 상태·담당자 검색, 서비스 지표와 저장 공간, 관련 파이프라인                  |
| 파이프라인  | 상태·프로젝트·브랜치 검색, 6개씩 페이지 이동, 단계별 상세, 재실행·완료 데모 |
| 러너        | CPU·메모리·실행 슬롯, 상태 필터, 복구·일시중지·재개 데모                    |
| 인시던트    | 상태별 보기, 대응 타임라인, 로컬 메모, 처리 상태 변경                       |
| 보안        | 심각도·상태 필터, 검토 완료 처리, 배포 전 점검 체크리스트                   |
| 화면 설정   | 글자 크기·테마 변경, 데모 데이터 초기화                                     |

공통: Ctrl/Cmd+K 검색, 환경 선택, 목록별 CSV 저장, 로컬 상태 저장.

## 데이터

**모든 데이터는 2026-10-31 16:40 KST를 기준으로 만든 가상 예시입니다.** 실제 GitLab API, 서버 또는 자격 증명을 사용하지 않습니다. 버전 번호와 보안 탐지도 실제 시스템에 대한 정보가 아닙니다.

14일간의 파이프라인 기록으로 KPI와 추이를 함께 계산합니다. 실행 중인 기록은 성공률 계산에서 제외합니다. 인시던트를 해결하면 해당 서비스의 현재 상태도 함께 바뀝니다. 30일 가용성과 응답 시간은 별도의 모의 SLI입니다.

모든 상태는 이 사이트 전용 `infradash2-v1-*` localStorage 키로 저장됩니다. 기존 사이트의 데이터는 읽거나 변경하지 않습니다. 화면 설정의 초기화는 운영 데모 기록만 초기화하고 글자 크기와 테마는 유지합니다.

## 개발

Node.js 24 이상을 권장합니다.

```sh
npm ci
npm run dev
# http://127.0.0.1:5173/infradash-codex2/
npm test
npm run build
npm run preview
```

React, Vite, Lucide, Fontsource와 직접 작성한 CSS를 사용합니다. GitHub Pages의 정적 호스팅을 위해 해시 라우팅을 사용합니다.

## 배포

`main`에 푸시하면 GitHub Actions가 테스트와 빌드를 실행하고 `dist/`를 GitHub Pages에 배포합니다. Pages Source는 GitHub Actions입니다. 기본 경로는 `/infradash-codex2/`입니다.

## 구조

```text
src/App.jsx         화면, 필터, 환경 선택, 로컬 상태
src/Details.jsx     상세 패널과 상태 변경
src/Trend.jsx       일별 성공률 추이
src/ui.jsx          공용 UI, 페이지 이동, 모달 초점 관리
src/model.js        독립적인 모의 데이터와 집계 함수
src/model.test.js   필터·집계 일관성·상태 연동·재실행·CSV 검증
src/styles.css     테마, 가독성, 반응형 스타일
```

Geist와 Noto Sans KR의 라이선스는 `public/licenses/`에 포함했습니다.
