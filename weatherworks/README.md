# WeatherWorks — 건설공사 비작업일수·공사기간 산정

기상 조건(강우·강설·풍속·기온), 공휴일을 기준으로 공종별 작업 가능일을 계산하고,
공사기간(작업일수 + 비작업일수)을 산정하는 정적 웹 애플리케이션입니다.

순수 HTML/CSS/JavaScript로 만들어져 별도의 빌드 과정 없이 그대로 GitHub Desktop과
Netlify로 배포할 수 있습니다.

## 주요 화면

| 메뉴 | 파일 | 설명 |
|---|---|---|
| 종합 현황 | `index.html` | 전체 현장 요약 대시보드 |
| 현장 관리 | `projects.html` | 현장 등록/수정/삭제 |
| 현장 상세 분석 | `project-detail.html?id=...` | 현장별 상세 분석 |
| 현장별 상세 분석 | `analysis.html` | 현장 목록 → 상세 분석 진입 |
| 일별 작업 가능성 | `calendar.html` | 월간 캘린더 뷰 |
| 예측 오차 분석 | `accuracy.html` | 예측값 vs 실제 기록 비교 |
| 기상 데이터 조회 | `weather.html` | 기상 데이터 엑셀/CSV 업로드·조회 |
| 공사 물량·생산성 산정 | `quantity.html` | 공종별 물량/표준작업량 입력 |
| 구간별 관측지점 | `stations.html` | 관측지점 관리 |
| 총괄·결과·Timeline | `duration.html` | 공사기간 산정 총괄 |
| 작업일수 산정 | `duration-workdays.html` | 물량 기반 필요 작업일수 |
| 비작업일수 산정 | `duration-weather.html` | 기상·공휴일·중복일 산정 (핵심 기능) |
| 산정근거 검토 | `duration-basis.html` | 적용 기준·공휴일·산정방법 |
| 산정 결과 보고서 | `duration-report.html` | 인쇄/PDF용 보고서 |
| 기상데이터 품질관리 | `quality.html` | 이상치 확인·수정·이력 |
| 공정표 Import | `schedule.html` | 계획/실제 공정 엑셀 업로드 |
| 데이터 관리 | `data.html` | 전체 데이터 백업/복원, CSV 내보내기 |
| 분석 보고서 | `reports.html` | 전체 현장 요약 보고서 |
| Admin | `admin.html` | 공종·작업가능 기준·공휴일 관리 |

## 데이터 저장 방식

서버 없이 동작하는 정적 사이트이므로, 모든 데이터는 **브라우저의 localStorage**에
저장됩니다 (기기·브라우저 간 동기화 없음). `데이터 관리` 화면에서 전체 데이터를
JSON으로 내보내고 불러올 수 있으니, 다른 기기에서 이어서 작업하려면 이 기능을
사용하세요.

처음 접속하면 계산 로직을 확인할 수 있도록 예시 현장 2건과 예시 기상 데이터가
자동으로 채워집니다. 실제 사용 시에는:

1. `Admin`에서 공종과 작업가능 기준(강우·풍속·강설·기온 한계)을 현장에 맞게 수정
2. `구간별 관측지점`에서 관측지점 등록
3. `현장 관리`에서 현장 추가 (관측지점·기간·적용 공종 연결)
4. `기상 데이터 조회`에서 실측 기상 자료를 엑셀/CSV로 업로드
5. `비작업일수 산정`, `작업일수 산정`, `총괄` 순으로 결과 확인

## 로컬에서 미리보기

빌드 도구가 필요 없습니다. 다음 중 하나로 바로 확인할 수 있습니다.

- `index.html` 파일을 브라우저로 더블클릭해서 열기
- 또는 VS Code의 Live Server 확장 사용
- 또는 터미널에서: `python3 -m http.server 8080` 실행 후 `http://localhost:8080` 접속

## GitHub Desktop으로 GitHub에 올리기

1. GitHub Desktop 실행 → **File → New Repository** (또는 기존 로컬 폴더를 그대로
   추가하려면 **Add Existing Repository**)
2. Repository name에 원하는 이름(예: `weatherworks`) 입력, Local path는 이 폴더
   (`weatherworks/`)의 **상위 폴더**를 지정하고, 이 폴더 안의 파일들을 그대로 복사해
   넣거나, 이 폴더 자체를 로컬 저장소 폴더로 지정합니다.
3. 왼쪽 하단 **Summary**에 커밋 메시지(예: `Initial commit`) 입력 후 **Commit to main**
4. 상단 **Publish repository** 버튼 클릭 → GitHub 계정으로 로그인 → Public/Private
   선택 후 **Publish**
5. 이후 파일을 수정할 때마다: 저장 → GitHub Desktop에서 변경사항 확인 → 커밋 메시지
   입력 → **Commit to main** → **Push origin**

## Netlify로 배포하기

가장 쉬운 방법은 GitHub 저장소를 그대로 연결하는 것입니다.

1. [app.netlify.com](https://app.netlify.com) 접속 → 로그인(GitHub 계정으로 로그인 추천)
2. **Add new site → Import an existing project** 클릭
3. **Deploy with GitHub** 선택 → 방금 만든 저장소(예: `weatherworks`) 선택
4. Build settings는 그대로 두면 됩니다 (Build command 비워두고, Publish directory는
   `.` 또는 비워둠 — 저장소에 포함된 `netlify.toml`이 자동으로 설정합니다)
5. **Deploy site** 클릭 → 1분 내로 `https://[임의이름].netlify.app` 주소가 생성됩니다
6. 이후 GitHub에 Push할 때마다 Netlify가 자동으로 다시 배포합니다 (Continuous Deployment)
7. 원하는 경우 Netlify **Site settings → Domain management**에서 사이트 이름이나
   커스텀 도메인을 변경할 수 있습니다

## 다음에 직접 손볼 만한 부분

- `js/seed.js`의 예시 공휴일·작업가능 기준 수치는 데모용입니다. 실제 계약조건·
  표준시방서 기준으로 교체하세요.
- 기상청 공공데이터 API 등 외부 API와 연동하려면 `weather.html`의 업로드 로직을
  API 호출로 교체하면 됩니다 (정적 사이트에서 API 키를 그대로 노출하지 않으려면
  Netlify Functions 같은 서버리스 함수 사용을 권장합니다).
- 여러 사용자가 함께 쓰려면 localStorage 대신 Supabase, Firebase 등 백엔드 연동이
  필요합니다.
