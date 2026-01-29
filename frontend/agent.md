# Frontend Agent 가이드 (React 18)

이 문서는 `frontend/` 디렉토리의 프론트엔드(React 18) 개발 시 **폴더 구조, 코드 규칙, API 연동 방식, PR/테스트 기준**을 통일하기 위한 가이드이다.  
린터/포매터가 없거나 약한 환경을 전제로 하므로 **주변 코드 스타일을 최우선으로 유지**한다.

---

## 1. 기술 스택
- React 18
- (권장) Vite 기반 개발 서버/빌드
- 언어: TypeScript 사용을 권장(프로젝트 설정에 따름)
- 스타일: `src/index.css` 전역 토큰/공통 스타일(프로젝트 기준)

---

## 2. 폴더 구조 (필수)

`src/` 아래는 아래 구조를 기본으로 한다.

```
src/
  assets/          # 이미지, svg, 폰트 등 정적 리소스
  pages/           # 라우트 단위 화면(페이지)
  routes/            # 라우팅 설정 및 Route 정의
  constants/       # 상수/열거/정적 설정값
  components/      # 공용 UI 컴포넌트(재사용 중심)
  utils/           # 범용 유틸 함수(도메인 비종속)
  api/             # API 호출, client 설정, DTO 타입, endpoint 정의
```

### 2.1 assets/
- 아이콘/SVG는 하위 폴더로 분리 권장
  - 예: `assets/icon/`, `assets/images/`
- 메뉴 아이콘 등 공통 아이콘은 한곳에서 관리

### 2.2 pages/ (페이지 단위)
- **라우트(화면) 단위**로 폴더를 만든다.
- 페이지 폴더 안에서만 쓰는 컴포넌트는 **페이지 폴더 내부에 함께 둔다**(페이지 전용 컴포넌트).

예)
```
pages/
  dashboard/
    DashboardPage.tsx
    components/
      OverviewCard.tsx
      DashboardTable.tsx
    hooks/          # (선택) 페이지 전용 훅
      useDashboardFilters.ts
    index.ts        # (선택) export 정리
  leads/
    LeadsPage.tsx
    components/
    index.ts
```

### 2.3 components/ (공용 컴포넌트)
- 여러 페이지에서 재사용 가능한 UI만 둔다.
- 권장 하위 구조:
```
components/
  layout/           # Sidebar, TopHeader, Shell 등 레이아웃
  common/           # Button, Input, Select, Modal, Table 등 공통 UI
  feedback/         # Toast, Spinner, EmptyState 등
  dialogs/          # 공용 다이얼로그(여러 페이지에서 공유)
```

> 특정 페이지에서만 쓰는 컴포넌트는 `components/`에 넣지 말고 해당 `pages/<page>/components/`에 둔다.

### 2.4 constants/
- 의미 있는 이름으로 그룹화한다.
  - 예: `constants/routes.ts`, `constants/storageKeys.ts`, `constants/lookupKeys.ts`
- 백엔드 lookup key와 매핑되는 값은 여기로 모아 관리(중복 하드코딩 금지)

### 2.5 utils/
- “어디서든 재사용 가능한 순수 함수”만 둔다.
- 예: 날짜 포맷, 숫자 포맷, 문자열 하이라이트, pagination 계산 등
- React 의존(훅/컴포넌트)이 들어가면 `utils/`가 아니라 해당 페이지/컴포넌트로 이동

### 2.6 api/
API 관련 코드는 `api/`로 집중시킨다.

권장 하위 구조(프로젝트 상황에 맞게 선택)
```
api/
  client.ts         # fetch/axios 인스턴스 + 공통 헤더 + 인터셉터
  endpoints.ts      # 경로 상수(예: /api/leads)
  types.ts          # 공통 타입(페이지 공용 DTO 등)
  leads.api.ts      # 도메인별 API 모듈
  deals.api.ts
  customers.api.ts
```

---

## 3. routes/ (라우팅 전용)

### 역할
- 전체 라우팅 구조를 한 눈에 파악 가능하도록 관리
- 페이지 컴포넌트와 라우팅 로직을 분리
- 인증/권한/레이아웃 분기 처리 담당

### 권장 구조
```
routes/
  index.tsx          # RouterProvider / BrowserRouter 설정
  AppRoutes.tsx      # 전체 Route 트리 정의
  ProtectedRoute.tsx # 인증/권한 보호 라우트
```

### 규칙
- 라우트 경로 문자열은 직접 작성하지 않고 `constants/routes.ts` 사용
- 페이지 컴포넌트는 반드시 `pages/` 아래에 위치
- routes에서는 **UI 렌더링 로직을 작성하지 않는다**

---

## 4. pages/ (페이지 단위)

- URL 기준의 “화면 단위”
- 페이지 컴포넌트명은 `<PascalCase>Page`


---

## 5. 컴포넌트 설계 규칙

- 여러 페이지에서 재사용되는 UI만 위치
- 권장 하위 구조:
  components/
    layout/
    common/
    feedback/
    dialogs/

---

## 5.1 공통 컴포넌트 작성 원칙 (중요)
- **반복해서 등장하는 UI는 가능한 한 공통 컴포넌트로 분리한다.**
  - 예: Button, Input, Select, Table, Modal, Dialog, Tabs, Badge,
        Toast, Spinner, EmptyState 등

- 공통화 판단 기준:
  1) 두 군데 이상에서 동일하거나 매우 유사한 UI가 반복되면 공통 컴포넌트 후보로 본다.
  2) 특정 페이지의 API/도메인 로직에 강하게 결합된 경우에는 공통화하지 않는다.
  3) 공통 컴포넌트는 **props 기반의 순수 UI 컴포넌트**로 유지한다.

- 위치 규칙:
  - 여러 페이지에서 재사용 → `src/components/**`
  - 특정 페이지에서만 사용 → `src/pages/<page>/components/**`

### 5.2 네이밍
- 컴포넌트: `PascalCase`
- 훅/함수: `camelCase`
- 파일명: 컴포넌트와 동일하게 유지 권장
  - 예: `LeadModal.tsx`, `CustomerSelect.tsx`

### 5.3 책임 분리
- UI 렌더링과 데이터 로딩을 분리한다.
  - 페이지에서 데이터 로딩/상태 관리
  - 공용 컴포넌트는 props 기반 “순수 UI”로 유지

### 5.4 Props 규칙
- boolean prop은 `is/has/can` 접두어 권장
  - 예: `isOpen`, `hasError`, `canEdit`

---

## 6. 스타일 규칙
- 전역 토큰/테마 값은 `src/index.css`에 둔다(프로젝트 기준 유지)
- 클래스 네이밍은 기존 컨벤션을 따른다(BEM-like 등)
- “페이지 전용 스타일”은 **반드시** 페이지 폴더 내부에 둔다
  - 예: `pages/leads/leads.css`
  - 페이지 컴포넌트에서 해당 CSS를 직접 import 한다
  - `src/index.css`에는 공통/전역 스타일만 남긴다

---

## 7. API 호출 규칙(권장 패턴)

### 7.1 client 단일화
- API 호출은 `api/client.ts`를 통해서만 수행한다.
- 공통 처리:
  - baseURL
  - JSON 파싱
  - 에러 처리(표준화)
  - 인증 토큰(필요 시)

### 7.2 에러 처리
- 백엔드가 `{ message, code }` 포맷을 사용한다면 프론트도 이를 그대로 활용한다.
- UI에서는:
  - 사용자 메시지: `message`
  - 분기 처리: `code`

### 7.3 타입(React 18 + TS)
- 요청/응답 타입은 `api/*`에 위치
- 페이지에서는 API 모듈을 호출하고 결과를 화면에 매핑

---

## 8. 상태 관리(추천 가이드)
- 초기 단계에서는 “컴포넌트 상태 + props”로 충분한 경우가 많다.
- 전역 상태가 필요해지면 아래 우선순위를 고려:
  1) URL Query / Search Params (필터/페이지네이션)
  2) React Context (작은 전역)
  3) 전역 스토어(규모/복잡도 증가 시 도입)

> 전역 상태 도입 전, “정말 여러 화면에서 공유되는 상태인지” 먼저 확인한다.

---

## 9. 성능/UX 권장 사항
- 목록 화면은 페이지네이션/무한 스크롤 중 하나를 일관되게 적용
- 로딩/에러/빈 상태(Empty State)를 반드시 제공
- 모달/다이얼로그:
  - 헤더-폼 간격(패딩/마진) 통일
  - 닫기 동작(ESC/바깥 클릭) 일관성 유지
- 폼:
  - 필수값 표시
  - 제출 중 중복 클릭 방지(disabled)

---

## 10. 테스트 가이드(자동 테스트 없음 기준)
- UI 변경 시 수동 테스트 체크:
  1) 주요 페이지 로딩 확인
  2) CRUD 흐름(생성/수정/삭제) 최소 1회
  3) 반응형(작은 해상도) 레이아웃 깨짐 여부
  4) 콘솔 에러/경고 확인
- PR에는 “어떤 화면에서 무엇을 확인했는지”를 간단히 남긴다.
- UI 변경은 스크린샷 첨부를 권장한다.

---
