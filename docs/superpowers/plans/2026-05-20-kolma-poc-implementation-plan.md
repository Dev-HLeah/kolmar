# Kolma AI Formulation PoC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** React + NestJS + Prisma + Supabase 기반으로 콜마 AI 배합 설계 PoC의 실행 가능한 골격과 핵심 업무 흐름을 만든다.

**Architecture:** 프론트엔드는 React/Vite가 연구 업무용 UI를 담당하고, 백엔드는 NestJS가 비즈니스 로직과 Supabase 연동을 담당한다. Supabase Postgres는 정형 데이터 원본, Supabase Storage는 파일 원본, pgvector는 의미 검색 인덱스로 사용한다.

**Tech Stack:** React.js, TypeScript, Vite, NestJS, Prisma ORM, Supabase Postgres/Storage/Auth/pgvector, Vercel, Railway, OpenAI API, Gemini API.

---

## 0. 진행 관리 원칙

이 계획 문서는 구현 중 계속 갱신한다.

- 작업 시작 시 해당 Task 상태를 `in_progress`로 바꾼다.
- 작업 완료 시 해당 Task 상태를 `done`으로 바꾼다.
- 각 Task는 테스트 또는 검증 명령을 실행한 뒤 커밋한다.
- 사용자가 요청한 참조문서 폴더 `docs/request/`는 Git에 올리지 않는다.
- 실제 비밀키는 `.env`에만 넣고 커밋하지 않는다.
- 저장소에는 `.env.example`만 커밋한다.

## 1. 입력이 필요한 값

프로젝트 생성 자체는 아래 값을 몰라도 시작할 수 있다. Supabase 연결, Prisma migration, AI 연동 검증 시점에는 값이 필요하다.

### Supabase

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `DIRECT_URL`

### AI Provider

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `AI_PROVIDER`

초기 권장값:

```env
AI_PROVIDER=openai
OPENAI_MODEL=gpt-4.1-mini
GEMINI_MODEL=gemini-1.5-flash
```

실제 모델명은 개발 시점의 사용 가능 모델에 맞춰 조정한다.

### Frontend

- `VITE_API_BASE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

초기 로컬 권장값:

```env
VITE_API_BASE_URL=http://localhost:3000
```

## 2. 작업 의존성과 병렬 가능 작업

| Task | 내용 | 상태 | 선행 작업 | 병렬 가능 여부 |
| --- | --- | --- | --- | --- |
| 1 | 모노레포 골격, React/Nest 프로젝트, env 계약 | pending | 없음 | 단독 |
| 2 | API 환경설정, Health check, 기본 테스트 | pending | Task 1 | Task 3 준비와 병렬 가능 |
| 3 | Prisma/Supabase 데이터 모델 | pending | Task 1 | Task 5와 병렬 가능 |
| 4 | Web 앱 Shell, 라우팅, 공통 입력 UX 기반 | pending | Task 1 | Task 2, 3과 병렬 가능 |
| 5 | 제품/처방 자산 API | pending | Task 2, 3 | Task 6과 병렬 가능 |
| 6 | 프로젝트/그룹/Try API | pending | Task 2, 3 | Task 5와 병렬 가능 |
| 7 | 테스트 결과/마킹 API | pending | Task 6 | Task 8과 일부 병렬 가능 |
| 8 | 제품/프로젝트 Web 화면 | pending | Task 4, 5, 6 | Task 9와 병렬 가능 |
| 9 | 근거/외부 데이터 수집 기반 | pending | Task 2, 3 | Task 8, 10과 병렬 가능 |
| 10 | Vector 검색 기반 | pending | Task 3, 9 | Task 11과 일부 병렬 가능 |
| 11 | AI Provider Adapter와 추천 초안 | pending | Task 2, 5, 6, 9 | Task 10과 일부 병렬 가능 |
| 12 | 통합 검증, 배포 설정, 문서 정리 | pending | Task 1-11 | 단독 |

병렬 처리 추천:

- Task 2와 Task 4는 서로 파일 충돌이 거의 없다.
- Task 5와 Task 6은 Prisma schema 확정 후 서로 다른 API 모듈로 나누어 병렬 가능하다.
- Task 8은 화면 작업이고 Task 9는 데이터 수집 기반이라 병렬 가능하다.
- Task 10과 Task 11은 인터페이스를 먼저 합의하면 일부 병렬 가능하다.

## 3. 파일 구조

생성/수정 예정 파일:

```text
.
├── package.json
├── package-lock.json
├── .gitignore
├── .env.example
├── README.md
├── apps/
│   ├── web/
│   │   ├── package.json
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── app/App.tsx
│   │       ├── app/routes.tsx
│   │       ├── api/client.ts
│   │       ├── components/
│   │       │   ├── Layout.tsx
│   │       │   ├── DataTable.tsx
│   │       │   └── FormulaInputTable.tsx
│   │       └── pages/
│   │           ├── DashboardPage.tsx
│   │           ├── ProductsPage.tsx
│   │           ├── ProductDetailPage.tsx
│   │           ├── ProjectsPage.tsx
│   │           └── ProjectDetailPage.tsx
│   └── api/
│       ├── package.json
│       ├── prisma/schema.prisma
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── config/env.ts
│       │   ├── health/health.controller.ts
│       │   ├── prisma/prisma.module.ts
│       │   ├── prisma/prisma.service.ts
│       │   ├── products/
│       │   ├── projects/
│       │   ├── evidence/
│       │   ├── ai/
│       │   └── search/
│       └── test/
└── docs/
    └── superpowers/
        ├── plans/
        └── specs/
```

책임 경계:

- `apps/web`: 연구자가 쓰는 화면과 입력 UX.
- `apps/api`: NestJS API, Prisma, Supabase, AI provider, import/search 로직.
- `apps/api/prisma/schema.prisma`: 정형 데이터 모델의 원본.
- `docs/superpowers/plans`: 구현 계획과 진행 상태.
- `docs/superpowers/specs`: 승인된 설계 문서.

## 4. Task 1: 모노레포 골격과 환경변수 계약

**상태:** pending

**Files:**

- Create: `package.json`
- Create: `.env.example`
- Modify: `.gitignore`
- Create: `README.md`
- Create: `apps/web/*`
- Create: `apps/api/*`

### Steps

- [ ] **Step 1: Task 상태를 in_progress로 변경**

`docs/superpowers/plans/2026-05-20-kolma-poc-implementation-plan.md`의 Task 1 상태를 `in_progress`로 바꾼다.

- [ ] **Step 2: React 프로젝트 생성**

Run:

```bash
npm create vite@latest apps/web -- --template react-ts
```

Expected:

```text
Scaffolding project in apps/web
```

- [ ] **Step 3: NestJS 프로젝트 생성**

Run:

```bash
npx @nestjs/cli new apps/api --skip-git --package-manager npm
```

Expected:

```text
CREATE apps/api
```

- [ ] **Step 4: 루트 workspace package 작성**

`package.json`:

```json
{
  "name": "kolma-ai-formulation-poc",
  "private": true,
  "version": "0.1.0",
  "workspaces": [
    "apps/web",
    "apps/api"
  ],
  "scripts": {
    "dev:web": "npm --workspace apps/web run dev",
    "dev:api": "npm --workspace apps/api run start:dev",
    "build:web": "npm --workspace apps/web run build",
    "build:api": "npm --workspace apps/api run build",
    "test:api": "npm --workspace apps/api run test",
    "lint:web": "npm --workspace apps/web run lint",
    "lint:api": "npm --workspace apps/api run lint"
  }
}
```

- [ ] **Step 5: 환경변수 예시 작성**

`.env.example`:

```env
# Frontend
VITE_API_BASE_URL=http://localhost:3000
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Supabase / Prisma
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
DIRECT_URL=

# AI
AI_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash

# API
API_PORT=3000
NODE_ENV=development
```

- [ ] **Step 6: Git ignore 확인**

`.gitignore`에 다음 내용이 있어야 한다.

```gitignore
.DS_Store
docs/.DS_Store
docs/request/
.env
.env.local
node_modules/
dist/
coverage/
```

- [ ] **Step 7: README 초안 작성**

`README.md`:

```markdown
# Kolma AI Formulation PoC

React + NestJS + Prisma + Supabase 기반 건강기능식품 AI 배합 설계 PoC입니다.

## Apps

- `apps/web`: React/Vite frontend
- `apps/api`: NestJS backend

## Local Setup

1. Copy `.env.example` to `.env`.
2. Fill Supabase and AI API keys.
3. Run `npm install`.
4. Run `npm run dev:api`.
5. Run `npm run dev:web`.

## Reference Documents

`docs/request/` contains local reference materials and is intentionally ignored by Git.
```

- [ ] **Step 8: 설치 및 기본 빌드 확인**

Run:

```bash
npm install
npm run build:web
npm run build:api
```

Expected:

```text
apps/web build succeeds
apps/api build succeeds
```

- [ ] **Step 9: Task 상태를 done으로 변경**

Task 1 상태를 `done`으로 바꾼다.

- [ ] **Step 10: Commit**

Run:

```bash
git add package.json package-lock.json .env.example .gitignore README.md apps/web apps/api docs/superpowers/plans/2026-05-20-kolma-poc-implementation-plan.md
git commit -m "chore: scaffold Kolma PoC workspace"
```

## 5. Task 2: API 환경설정과 Health Check

**상태:** pending

**Files:**

- Create: `apps/api/src/config/env.ts`
- Create: `apps/api/src/health/health.controller.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/src/main.ts`
- Test: `apps/api/src/health/health.controller.spec.ts`

### Steps

- [ ] **Step 1: Task 상태를 in_progress로 변경**

- [ ] **Step 2: 필요한 패키지 설치**

Run:

```bash
npm --workspace apps/api install @nestjs/config zod
```

- [ ] **Step 3: 환경변수 검증 모듈 작성**

`apps/api/src/config/env.ts`:

```ts
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().default(3000),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  AI_PROVIDER: z.enum(['openai', 'gemini', 'mock']).default('mock'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4.1-mini'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-1.5-flash')
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  return envSchema.parse(config);
}
```

- [ ] **Step 4: Health Controller 테스트 작성**

`apps/api/src/health/health.controller.spec.ts`:

```ts
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns ok status', () => {
    const controller = new HealthController();

    expect(controller.getHealth()).toEqual({
      status: 'ok',
      service: 'kolma-api'
    });
  });
});
```

- [ ] **Step 5: 실패 확인**

Run:

```bash
npm --workspace apps/api test -- health.controller.spec.ts
```

Expected:

```text
Cannot find module './health.controller'
```

- [ ] **Step 6: Health Controller 구현**

`apps/api/src/health/health.controller.ts`:

```ts
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'kolma-api'
    };
  }
}
```

- [ ] **Step 7: AppModule에 Config와 Health 등록**

`apps/api/src/app.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv
    })
  ],
  controllers: [HealthController],
  providers: []
})
export class AppModule {}
```

- [ ] **Step 8: main.ts에서 포트 사용**

`apps/api/src/main.ts`:

```ts
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const config = app.get(ConfigService);
  const port = config.get<number>('API_PORT') ?? 3000;

  await app.listen(port);
}

void bootstrap();
```

- [ ] **Step 9: 테스트 및 빌드**

Run:

```bash
npm --workspace apps/api test -- health.controller.spec.ts
npm run build:api
```

Expected:

```text
PASS src/health/health.controller.spec.ts
```

- [ ] **Step 10: Commit**

```bash
git add apps/api docs/superpowers/plans/2026-05-20-kolma-poc-implementation-plan.md
git commit -m "feat(api): add environment config and health check"
```

## 6. Task 3: Prisma/Supabase 데이터 모델

**상태:** pending

**Files:**

- Create: `apps/api/prisma/schema.prisma`
- Modify: `apps/api/package.json`

### Steps

- [ ] **Step 1: Task 상태를 in_progress로 변경**

- [ ] **Step 2: Prisma 설치**

Run:

```bash
npm --workspace apps/api install @prisma/client
npm --workspace apps/api install --save-dev prisma
```

- [ ] **Step 3: Prisma schema 작성**

`apps/api/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum UserRole {
  ADMIN
  RESEARCHER
  VIEWER
}

enum TryStatus {
  DRAFT
  PLANNED
  IN_PROGRESS
  TESTED
  CANDIDATE
  FINAL_CANDIDATE
  DISCARDED
  ON_HOLD
}

enum TryMarkType {
  PROMISING
  ISSUE_FOUND
  BASELINE_CANDIDATE
  FINAL_CANDIDATE
  DISCARDED
  NEEDS_REVIEW
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      UserRole @default(RESEARCHER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Ingredient {
  id          String            @id @default(cuid())
  name        String            @unique
  description String?
  aliases     IngredientAlias[]
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
}

model IngredientAlias {
  id           String     @id @default(cuid())
  ingredientId String
  alias        String
  source       String?
  ingredient   Ingredient @relation(fields: [ingredientId], references: [id], onDelete: Cascade)

  @@unique([ingredientId, alias])
}

model DosageForm {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  isKolmarSpecial Boolean @default(false)
}

model PackagingOption {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  isKolmarSpecial Boolean @default(false)
}

model Product {
  id          String           @id @default(cuid())
  name        String
  category    String?
  target      String?
  function    String?
  dosageFormId String?
  packagingId String?
  dosageForm  DosageForm?      @relation(fields: [dosageFormId], references: [id])
  packaging   PackagingOption? @relation(fields: [packagingId], references: [id])
  formulas    ProductFormula[]
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
}

model ProductFormula {
  id          String                     @id @default(cuid())
  productId   String
  version     String
  note        String?
  product     Product                    @relation(fields: [productId], references: [id], onDelete: Cascade)
  ingredients ProductFormulaIngredient[]
  createdAt   DateTime                   @default(now())
  updatedAt   DateTime                   @updatedAt

  @@unique([productId, version])
}

model ProductFormulaIngredient {
  id           String         @id @default(cuid())
  formulaId    String
  ingredientId String
  amount       Decimal?
  unit         String?
  ratio        Decimal?
  role         String?
  formula      ProductFormula @relation(fields: [formulaId], references: [id], onDelete: Cascade)
  ingredient   Ingredient     @relation(fields: [ingredientId], references: [id])
}

model DevelopmentProject {
  id          String            @id @default(cuid())
  name        String
  goal        String?
  target      String?
  function    String?
  desiredForm String?
  costRange   String?
  excludedIngredients String?
  sourceProductId String?
  sourceFormulaId String?
  groups      ExperimentGroup[]
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
}

model ExperimentGroup {
  id        String             @id @default(cuid())
  projectId String
  name      String
  purpose   String?
  project   DevelopmentProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tries     FormulaTry[]
  createdAt DateTime           @default(now())
  updatedAt DateTime           @updatedAt
}

model FormulaTry {
  id        String          @id @default(cuid())
  groupId   String
  tryNumber Int
  status    TryStatus       @default(DRAFT)
  title     String?
  memo      String?
  group     ExperimentGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  ingredients TryIngredient[]
  testResults TryTestResult[]
  marks       TryMark[]
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt

  @@unique([groupId, tryNumber])
}

model TryIngredient {
  id           String     @id @default(cuid())
  tryId        String
  ingredientId String
  amount       Decimal?
  unit         String?
  ratio        Decimal?
  note         String?
  formulaTry   FormulaTry @relation(fields: [tryId], references: [id], onDelete: Cascade)
  ingredient   Ingredient @relation(fields: [ingredientId], references: [id])
}

model TryTestResult {
  id          String     @id @default(cuid())
  tryId       String
  testPurpose String?
  measuredItem String?
  measuredValue String?
  unit        String?
  judgment    String?
  memo        String?
  formulaTry  FormulaTry @relation(fields: [tryId], references: [id], onDelete: Cascade)
  createdAt   DateTime   @default(now())
}

model TryMark {
  id         String      @id @default(cuid())
  tryId      String
  type       TryMarkType
  reason     String?
  formulaTry FormulaTry  @relation(fields: [tryId], references: [id], onDelete: Cascade)
  createdAt  DateTime    @default(now())
}

model EvidenceSource {
  id        String         @id @default(cuid())
  name      String
  type      String
  baseUrl   String?
  items     EvidenceItem[]
  createdAt DateTime       @default(now())
}

model EvidenceItem {
  id        String         @id @default(cuid())
  sourceId  String
  title     String
  summary   String?
  rawText   String?
  sourceUrl String?
  grade     String
  source    EvidenceSource @relation(fields: [sourceId], references: [id], onDelete: Cascade)
  links     EvidenceLink[]
  createdAt DateTime       @default(now())
}

model EvidenceLink {
  id          String       @id @default(cuid())
  evidenceId  String
  targetType  String
  targetId    String
  relation    String?
  evidence    EvidenceItem @relation(fields: [evidenceId], references: [id], onDelete: Cascade)
}

model DataImportJob {
  id          String   @id @default(cuid())
  sourceName  String
  status      String
  startedAt   DateTime @default(now())
  finishedAt  DateTime?
  message     String?
}
```

- [ ] **Step 4: Prisma scripts 추가**

`apps/api/package.json` scripts에 추가:

```json
{
  "prisma:generate": "prisma generate",
  "prisma:validate": "prisma validate",
  "prisma:migrate": "prisma migrate dev"
}
```

- [ ] **Step 5: Schema 검증**

Supabase 값이 없으면 `prisma validate`만 실행한다.

Run:

```bash
npm --workspace apps/api run prisma:validate
```

Expected:

```text
The schema at prisma/schema.prisma is valid
```

- [ ] **Step 6: Commit**

```bash
git add apps/api/prisma apps/api/package.json package-lock.json docs/superpowers/plans/2026-05-20-kolma-poc-implementation-plan.md
git commit -m "feat(api): add Prisma domain schema"
```

## 7. Task 4: Web 앱 Shell과 공통 입력 UX 기반

**상태:** pending

**Files:**

- Create: `apps/web/src/app/App.tsx`
- Create: `apps/web/src/app/routes.tsx`
- Create: `apps/web/src/components/Layout.tsx`
- Create: `apps/web/src/components/FormulaInputTable.tsx`
- Create: `apps/web/src/api/client.ts`
- Create: `apps/web/src/pages/DashboardPage.tsx`

### Steps

- [ ] **Step 1: Task 상태를 in_progress로 변경**

- [ ] **Step 2: 라우팅 패키지 설치**

Run:

```bash
npm --workspace apps/web install react-router-dom
```

- [ ] **Step 3: API client 작성**

`apps/web/src/api/client.ts`:

```ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`GET ${path} failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}
```

- [ ] **Step 4: Layout 작성**

`apps/web/src/components/Layout.tsx`:

```tsx
import { NavLink, Outlet } from 'react-router-dom';
import './Layout.css';

export function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <strong>Kolma PoC</strong>
        <nav>
          <NavLink to="/">대시보드</NavLink>
          <NavLink to="/products">제품/처방</NavLink>
          <NavLink to="/projects">프로젝트</NavLink>
        </nav>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 5: FormulaInputTable 작성**

`apps/web/src/components/FormulaInputTable.tsx`:

```tsx
type FormulaRow = {
  ingredientName: string;
  amount: string;
  unit: string;
  note: string;
};

type Props = {
  rows: FormulaRow[];
  onChange: (rows: FormulaRow[]) => void;
};

export function FormulaInputTable({ rows, onChange }: Props) {
  function updateRow(index: number, key: keyof FormulaRow, value: string) {
    const nextRows = rows.map((row, rowIndex) =>
      rowIndex === index ? { ...row, [key]: value } : row
    );
    onChange(nextRows);
  }

  return (
    <table>
      <thead>
        <tr>
          <th>원료명</th>
          <th>함량</th>
          <th>단위</th>
          <th>메모</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>
            <td><input value={row.ingredientName} onChange={(event) => updateRow(index, 'ingredientName', event.target.value)} /></td>
            <td><input value={row.amount} onChange={(event) => updateRow(index, 'amount', event.target.value)} /></td>
            <td><input value={row.unit} onChange={(event) => updateRow(index, 'unit', event.target.value)} /></td>
            <td><input value={row.note} onChange={(event) => updateRow(index, 'note', event.target.value)} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 6: Build 확인**

Run:

```bash
npm run build:web
```

Expected:

```text
✓ built
```

- [ ] **Step 7: Commit**

```bash
git add apps/web docs/superpowers/plans/2026-05-20-kolma-poc-implementation-plan.md
git commit -m "feat(web): add application shell and formula input table"
```

## 8. Task 5: 제품/처방 자산 API

**상태:** pending

**Files:**

- Create: `apps/api/src/products/products.module.ts`
- Create: `apps/api/src/products/products.controller.ts`
- Create: `apps/api/src/products/products.service.ts`
- Create: `apps/api/src/products/dto/create-product.dto.ts`
- Create: `apps/api/src/products/products.service.spec.ts`

### Steps

- [ ] **Step 1: Task 상태를 in_progress로 변경**

- [ ] **Step 2: failing service test 작성**

테스트는 PrismaService를 mock으로 주입해 `createProduct`가 제품을 생성하는지 확인한다.

- [ ] **Step 3: DTO 작성**

`create-product.dto.ts`는 제품명, 기능성, 타깃, 제형, 포장, 처방 원료 배열을 받는다. 처방 원료의 함량 값은 선택값으로 둔다.

- [ ] **Step 4: Service 구현**

`ProductsService`는 `createProduct`, `findProducts`, `findProductById`를 제공한다.

- [ ] **Step 5: Controller 구현**

엔드포인트:

- `POST /products`
- `GET /products`
- `GET /products/:id`

- [ ] **Step 6: 테스트와 빌드**

Run:

```bash
npm --workspace apps/api test -- products.service.spec.ts
npm run build:api
```

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/products docs/superpowers/plans/2026-05-20-kolma-poc-implementation-plan.md
git commit -m "feat(api): add product formula asset endpoints"
```

## 9. Task 6: 프로젝트/그룹/Try API

**상태:** pending

**Files:**

- Create: `apps/api/src/projects/projects.module.ts`
- Create: `apps/api/src/projects/projects.controller.ts`
- Create: `apps/api/src/projects/projects.service.ts`
- Create: `apps/api/src/projects/dto/create-project.dto.ts`
- Create: `apps/api/src/projects/dto/create-experiment-group.dto.ts`
- Create: `apps/api/src/projects/dto/create-formula-try.dto.ts`
- Create: `apps/api/src/projects/projects.service.spec.ts`

### Steps

- [ ] **Step 1: Task 상태를 in_progress로 변경**

- [ ] **Step 2: failing service test 작성**

테스트는 try 생성 시 `tryNumber`, `groupId`, `status=DRAFT`만으로 생성 가능한지 확인한다.

- [ ] **Step 3: DTO 작성**

Try DTO에서 배합, 제형, 제조 조건, 메모는 모두 선택값으로 둔다.

- [ ] **Step 4: Service 구현**

기능:

- 프로젝트 생성
- 기존 제품/처방 기반 프로젝트 생성
- 실험 그룹 생성
- try 생성
- 프로젝트 상세 조회

- [ ] **Step 5: Controller 구현**

엔드포인트:

- `POST /projects`
- `GET /projects`
- `GET /projects/:id`
- `POST /projects/:projectId/groups`
- `POST /projects/groups/:groupId/tries`

- [ ] **Step 6: 테스트와 빌드**

Run:

```bash
npm --workspace apps/api test -- projects.service.spec.ts
npm run build:api
```

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/projects docs/superpowers/plans/2026-05-20-kolma-poc-implementation-plan.md
git commit -m "feat(api): add project group and try endpoints"
```

## 10. Task 7: 테스트 결과와 Try 마킹 API

**상태:** pending

**Files:**

- Modify: `apps/api/src/projects/projects.controller.ts`
- Modify: `apps/api/src/projects/projects.service.ts`
- Create: `apps/api/src/projects/dto/create-test-result.dto.ts`
- Create: `apps/api/src/projects/dto/create-try-mark.dto.ts`

### Steps

- [ ] **Step 1: Task 상태를 in_progress로 변경**

- [ ] **Step 2: 테스트 작성**

테스트 결과는 모든 필드가 선택값이어도 `tryId`만으로 저장 가능한지 확인한다.

- [ ] **Step 3: DTO 작성**

테스트 결과 DTO와 마킹 DTO를 작성한다.

- [ ] **Step 4: Service 확장**

기능:

- try 테스트 결과 등록
- try 마킹 등록
- 의미 있는 try 필터 조회

- [ ] **Step 5: Controller 확장**

엔드포인트:

- `POST /projects/tries/:tryId/test-results`
- `POST /projects/tries/:tryId/marks`
- `GET /projects/:projectId/tries/marked`

- [ ] **Step 6: 테스트와 빌드**

Run:

```bash
npm --workspace apps/api test -- projects.service.spec.ts
npm run build:api
```

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/projects docs/superpowers/plans/2026-05-20-kolma-poc-implementation-plan.md
git commit -m "feat(api): add try test results and marks"
```

## 11. Task 8: 제품/프로젝트 Web 화면

**상태:** pending

**Files:**

- Create: `apps/web/src/pages/ProductsPage.tsx`
- Create: `apps/web/src/pages/ProductDetailPage.tsx`
- Create: `apps/web/src/pages/ProjectsPage.tsx`
- Create: `apps/web/src/pages/ProjectDetailPage.tsx`
- Modify: `apps/web/src/app/routes.tsx`

### Steps

- [ ] **Step 1: Task 상태를 in_progress로 변경**

- [ ] **Step 2: 제품 목록/등록 화면 작성**

제품명, 기능성, 제형, 처방 원료를 담백한 폼으로 입력한다.

- [ ] **Step 3: 프로젝트 목록/생성 화면 작성**

신규 생성과 기존 제품 기반 시작 옵션을 제공한다.

- [ ] **Step 4: 프로젝트 상세 화면 작성**

그룹 목록, try 목록, 의미 있는 try 필터, 테스트 결과 등록 영역을 보여준다.

- [ ] **Step 5: Build 확인**

Run:

```bash
npm run build:web
```

- [ ] **Step 6: Commit**

```bash
git add apps/web docs/superpowers/plans/2026-05-20-kolma-poc-implementation-plan.md
git commit -m "feat(web): add product and project workflows"
```

## 12. Task 9: 근거/외부 데이터 수집 기반

**상태:** pending

**Files:**

- Create: `apps/api/src/evidence/evidence.module.ts`
- Create: `apps/api/src/evidence/evidence.controller.ts`
- Create: `apps/api/src/evidence/evidence.service.ts`
- Create: `apps/api/src/evidence/import-jobs.service.ts`
- Create: `apps/api/src/evidence/evidence.service.spec.ts`

### Steps

- [ ] **Step 1: Task 상태를 in_progress로 변경**

- [ ] **Step 2: 테스트 작성**

Open API 원본 응답을 `RawExternalRecord` 성격의 데이터로 저장하고, 정규화 상태를 추적하는 테스트를 작성한다.

- [ ] **Step 3: Evidence Service 구현**

기능:

- 근거 출처 등록
- 근거 아이템 등록
- 근거 링크 등록
- import job 상태 기록

- [ ] **Step 4: Controller 구현**

엔드포인트:

- `POST /evidence/sources`
- `GET /evidence/sources`
- `POST /evidence/items`
- `GET /evidence/items`
- `POST /evidence/import-jobs`

- [ ] **Step 5: 테스트와 빌드**

Run:

```bash
npm --workspace apps/api test -- evidence.service.spec.ts
npm run build:api
```

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/evidence docs/superpowers/plans/2026-05-20-kolma-poc-implementation-plan.md
git commit -m "feat(api): add evidence import foundation"
```

## 13. Task 10: Vector 검색 기반

**상태:** pending

**Files:**

- Create: `apps/api/src/search/search.module.ts`
- Create: `apps/api/src/search/search.controller.ts`
- Create: `apps/api/src/search/search.service.ts`
- Modify: `apps/api/prisma/schema.prisma`

### Steps

- [ ] **Step 1: Task 상태를 in_progress로 변경**

- [ ] **Step 2: pgvector 확장 메모 추가**

Prisma schema 또는 migration SQL에 Supabase SQL Editor에서 실행할 SQL을 문서화한다.

```sql
create extension if not exists vector;
```

- [ ] **Step 3: 검색 서비스 인터페이스 작성**

`SearchService`는 정형 검색과 벡터 검색을 나누어 제공한다.

- [ ] **Step 4: Mock vector search 구현**

Supabase 연결값이 없을 때도 개발이 가능하도록 mock 결과를 반환한다.

- [ ] **Step 5: Controller 구현**

엔드포인트:

- `GET /search?q=...`

- [ ] **Step 6: 테스트와 빌드**

Run:

```bash
npm run build:api
```

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/search apps/api/prisma docs/superpowers/plans/2026-05-20-kolma-poc-implementation-plan.md
git commit -m "feat(api): add vector search foundation"
```

## 14. Task 11: AI Provider Adapter와 추천 초안

**상태:** pending

**Files:**

- Create: `apps/api/src/ai/ai.module.ts`
- Create: `apps/api/src/ai/ai-provider.interface.ts`
- Create: `apps/api/src/ai/openai.provider.ts`
- Create: `apps/api/src/ai/gemini.provider.ts`
- Create: `apps/api/src/ai/mock-ai.provider.ts`
- Create: `apps/api/src/ai/recommendation.service.ts`
- Create: `apps/api/src/ai/recommendation.controller.ts`

### Steps

- [ ] **Step 1: Task 상태를 in_progress로 변경**

- [ ] **Step 2: AI SDK 설치**

Run:

```bash
npm --workspace apps/api install openai @google/generative-ai
```

- [ ] **Step 3: Provider 인터페이스 작성**

`AiProvider`는 `generateText(prompt: string): Promise<string>` 하나로 시작한다.

- [ ] **Step 4: Mock Provider 구현**

키가 없어도 개발할 수 있도록 `AI_PROVIDER=mock`일 때 고정 추천 결과를 반환한다.

- [ ] **Step 5: OpenAI/Gemini Provider 구현**

각 provider는 env에 키가 없으면 명확한 설정 오류를 던진다.

- [ ] **Step 6: Recommendation Service 구현**

프로젝트 조건과 기준 처방을 받아 다음 후보를 만든다.

- 안정성 우선 후보
- 기능성 우선 후보
- 맛/관능 개선 후보
- 원가 절감 후보
- 콜마 특화 제형 후보
- 기존 처방 최소 변경 후보

- [ ] **Step 7: Controller 구현**

엔드포인트:

- `POST /recommendations/draft-tries`

- [ ] **Step 8: 테스트와 빌드**

Run:

```bash
npm run build:api
```

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/ai apps/api/package.json package-lock.json docs/superpowers/plans/2026-05-20-kolma-poc-implementation-plan.md
git commit -m "feat(api): add AI provider adapters and draft recommendations"
```

## 15. Task 12: 통합 검증, 배포 설정, 문서 정리

**상태:** pending

**Files:**

- Create: `apps/api/railway.json`
- Create: `apps/web/vercel.json`
- Modify: `README.md`
- Modify: `docs/superpowers/plans/2026-05-20-kolma-poc-implementation-plan.md`

### Steps

- [ ] **Step 1: Task 상태를 in_progress로 변경**

- [ ] **Step 2: Railway 설정 작성**

`apps/api/railway.json`:

```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start:prod"
  }
}
```

- [ ] **Step 3: Vercel 설정 작성**

`apps/web/vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

- [ ] **Step 4: 전체 검증**

Run:

```bash
npm run build:api
npm run build:web
npm run test:api
```

Expected:

```text
api build succeeds
web build succeeds
api tests pass
```

- [ ] **Step 5: README에 실행법 갱신**

README에 Supabase, OpenAI, Gemini env 입력 위치와 로컬 실행 명령을 기록한다.

- [ ] **Step 6: Task 상태를 done으로 변경**

- [ ] **Step 7: Commit**

```bash
git add apps/api/railway.json apps/web/vercel.json README.md docs/superpowers/plans/2026-05-20-kolma-poc-implementation-plan.md
git commit -m "chore: add deployment configuration and setup docs"
```

## 16. 실행 전 확인

구현 시작 전 사용자가 제공하면 좋은 값:

- Supabase 프로젝트 URL
- Supabase anon key
- Supabase service role key
- Supabase Postgres `DATABASE_URL`
- Supabase Postgres `DIRECT_URL`
- 사용할 AI provider: `openai`, `gemini`, `mock`
- OpenAI API key
- Gemini API key

값이 없어도 Task 1, 2, 4는 진행 가능하다. Task 3은 Prisma schema validate까지 가능하고, 실제 migration은 Supabase 연결값이 필요하다. Task 11은 `mock` provider로 먼저 구현하고 실제 키는 나중에 넣을 수 있다.

## 17. Self Review

Spec coverage:

- 기존 제품/처방 자산 관리: Task 3, 5, 8
- 기존 처방 기반 신규 프로젝트 시작: Task 6, 8
- 프로젝트/그룹/try 구조: Task 3, 6, 8
- try 선택값 구조: Task 3, 6, 7
- 테스트 결과와 마킹: Task 7, 8
- Open API 저장/재사용 기반: Task 3, 9
- Vector 검색: Task 10
- AI provider와 추천 초안: Task 11
- 경량 인프라: Task 1, 12
- 진행 여부 업데이트와 커밋 단위: 모든 Task

Placeholder scan:

- 비어 있는 자리표시자 표현을 사용하지 않는다.
- 실제 비밀키 값은 문서에 넣지 않는다.

Type consistency:

- 계획 전체에서 프로젝트는 `DevelopmentProject`, 그룹은 `ExperimentGroup`, try는 `FormulaTry`로 통일한다.
- try 상태는 `TryStatus`, 마킹은 `TryMarkType`로 통일한다.
