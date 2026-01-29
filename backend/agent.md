# Backend Agent 가이드 (Node.js + Express + MySQL + TypeScript)

이 문서는 `backend/` 디렉토리의 백엔드를 **Node.js 환경에서 MySQL을 사용하여 개발·운영**하기 위한 기준을 설명한다.  
신규 인원 온보딩, 유지보수, 기능 확장을 모두 고려한 가이드이다.

---

## 1. 기술 스택
- Runtime: Node.js (LTS 권장)
- Language: TypeScript
- Framework: Express
- Database: MySQL
- Entry 파일: `backend/src/index.ts`
- SQL 관리: `backend/sql/` (schema / seed)

---

## 2. 프로젝트 구조
```
backend/
  src/
    index.ts
    routes/
    services/
    db/
    middlewares/
    utils/
  sql/
```

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

## 6. 권장 분리 구조
```
backend/
  src/
    index.ts
    routes/
    services/
    db/
    middlewares/
    utils/
```

---

## 7. 신입 온보딩 요약
- `src/index.ts` 확인
- env 설정
- health 체크
