# Backend Agent 가이드 (Node.js + Express + MySQL + TypeScript)

이 문서는 `backend/` 디렉토리의 백엔드를 **Node.js 환경에서 MySQL을 사용하여 개발·운영**하기 위한 기준을 설명한다.  
신규 인원 온보딩, 유지보수, 기능 확장을 모두 고려한 가이드이다.

---

## 1. 기술 스택
- Runtime: Node.js (LTS 권장)
- Language: TypeScript
- Framework: Express
- Database: MySQL (Sequelize ORM)
- Entry 파일: `backend/src/index.ts`
- SQL 관리: `backend/sql/` (schema / seed)

---

## 2. 프로젝트 구조
리소스가 늘어나도 동일한 규칙으로 자동 확장될 수 있도록 **리소스별 폴더 구조**를 기본으로 한다.
```
backend/
  src/
    index.ts
    models/
      index.ts
    routes/
      _shared/
        activityLogs.ts
        columns.ts
        sequence.ts
      <resourceCamelCase>/ (users/projects 제외)
        index.ts
        create.ts
        get.ts
        update.ts
        delete.ts
    db/
    middlewares/
    utils/
  sql/
```
`<resourceCamelCase>`는 API 리소스명을 camelCase로 표현한 폴더명이다.

---

## 3. 로컬 개발 환경
```bash
cd backend
npm install
npm run dev
```

---

## 4. 환경 변수
```env
DB_HOST=localhost
DB_USER=myuser
DB_PASSWORD=mypassword
DB_NAME=mydb
ALLOWED_ORIGINS=http://localhost:5173
```

---

## 5. 에러 응답 포맷
```json
{
  "message": "에러 설명",
  "code": "ERROR_CODE"
}
```

---

## 6. 분리 원칙 (리소스 기반)
- `src/index.ts`는 앱 설정 + 라우터 등록만 담당한다.
- 라우팅과 비즈니스 규칙/흐름 제어는 `routes/<resourceCamelCase>/index.ts`에서 담당한다.
- CRUD 구현은 `routes/<resourceCamelCase>/{create,get,update,delete}.ts`로 분리한다.
- 공통 헬퍼(로그/시퀀스/컬럼 로더 등)는 `routes/_shared/`에 둔다.
- DB 접근은 Sequelize 모델을 통해서만 수행한다 (raw SQL 직접 호출 금지).
- 새로운 API 리소스 추가 시 camelCase 폴더를 routes에 동일하게 생성한다.

---

## 7. 신입 온보딩 요약
- `src/index.ts` 확인
- env 설정
- health 체크
