# Frontend Agent 가이드 (React 18)

이 문서는 `frontend/` 디렉토리의 프론트엔드(React 18) 개발 시  
**폴더 구조, 컴포넌트 분리 기준, API 연동 방식, PR/테스트 기준**을 통일하기 위한 가이드이다.

> 린터/포매터가 없거나 약한 환경을 전제로 하므로  
> **기존 코드 스타일 및 주변 컨벤션을 최우선으로 유지**한다.

---

## 1. 기술 스택
- React 18
- (권장) Vite 기반 개발 서버/빌드
- 언어: TypeScript 사용 권장(프로젝트 설정에 따름)
- 스타일: `src/index.css` 전역 토큰/공통 스타일 사용

---

## 2. 폴더 구조 (구조 정의)

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

---

## 3. routes/
- 라우팅 전용 디렉토리
- UI 로직 작성 금지
- 경로 상수는 `constants/routes.ts` 사용

---

## 4. pages/
- URL 기준 화면 단위
- `<PascalCase>Page` 네이밍
- 페이지 전용 컴포넌트/훅/스타일은 페이지 폴더 내부에 둔다

---

## 5. components/ (공통 컴포넌트 규칙)
- 두 페이지 이상 재사용되는 UI만 위치
- props 기반 순수 UI 유지
- 페이지 전용 UI는 `pages/<page>/components`

하위 구조:
```
components/
  layout/
  common/
  feedback/
  dialogs/
```

---

## 6. 네이밍 & 책임 분리
- 컴포넌트: PascalCase
- 훅/함수: camelCase
- boolean props: is/has/can
- 페이지는 데이터/상태, 컴포넌트는 UI만 담당

---

## 7. constants/
- routes, storageKeys, lookupKeys 등 의미 단위로 분리
- 하드코딩 금지

---

## 8. utils/
- React 의존 없는 순수 함수만 허용

---

## 9. api/
- client.ts 단일 진입점
- 공통 에러 포맷 유지
- 타입은 api 내부에 위치

---

## 10. 상태 관리
1. URL Query
2. React Context
3. 전역 스토어

---

## 11. 스타일
- 전역: src/index.css
- 페이지 전용: pages/<page>/<page>.css

---

## 12. 테스트 & PR
- 주요 화면 로딩 확인
- CRUD 최소 1회
- 콘솔 에러 확인
- UI 변경 시 스크린샷 권장
