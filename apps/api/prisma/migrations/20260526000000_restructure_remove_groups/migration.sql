-- Migration: 그룹 제거, FormulaTry를 프로젝트에 직접 연결, CANDIDATE 상태 추가

-- 1. ProductStatus에 CANDIDATE 추가
ALTER TYPE "ProductStatus" ADD VALUE IF NOT EXISTS 'CANDIDATE';

-- 2. DevelopmentProject에 background, objective 컬럼 추가
ALTER TABLE "DevelopmentProject" ADD COLUMN IF NOT EXISTS "background" TEXT;
ALTER TABLE "DevelopmentProject" ADD COLUMN IF NOT EXISTS "objective" TEXT;

-- 3. FormulaTry에 projectId(nullable), starred 컬럼 추가
ALTER TABLE "FormulaTry" ADD COLUMN IF NOT EXISTS "projectId" TEXT;
ALTER TABLE "FormulaTry" ADD COLUMN IF NOT EXISTS "starred" BOOLEAN NOT NULL DEFAULT false;

-- 4. ExperimentGroup을 통해 projectId 채우기
UPDATE "FormulaTry" ft
SET "projectId" = eg."projectId"
FROM "ExperimentGroup" eg
WHERE ft."groupId" = eg.id
  AND ft."projectId" IS NULL;

-- 5. 고아 try(그룹 없는 경우) 처리: 첫 번째 프로젝트로 매핑
UPDATE "FormulaTry"
SET "projectId" = (SELECT id FROM "DevelopmentProject" ORDER BY "createdAt" LIMIT 1)
WHERE "projectId" IS NULL;

-- 6. projectId NOT NULL 설정
ALTER TABLE "FormulaTry" ALTER COLUMN "projectId" SET NOT NULL;

-- 7. projectId FK 추가
ALTER TABLE "FormulaTry"
  ADD CONSTRAINT "FormulaTry_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "DevelopmentProject"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 8. 기존 unique 제약 삭제 (groupId, tryNumber)
ALTER TABLE "FormulaTry" DROP CONSTRAINT IF EXISTS "FormulaTry_groupId_tryNumber_key";

-- 9. 같은 프로젝트 안에 tryNumber 중복이 있으면 재번호 (safety)
-- (각 프로젝트 내에서 tryNumber를 순서대로 재할당)
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY "projectId" ORDER BY "createdAt", id) AS new_number
  FROM "FormulaTry"
)
UPDATE "FormulaTry" ft
SET "tryNumber" = r.new_number
FROM ranked r
WHERE ft.id = r.id;

-- 10. 새 unique 제약 추가 (projectId, tryNumber)
ALTER TABLE "FormulaTry"
  ADD CONSTRAINT "FormulaTry_projectId_tryNumber_key"
  UNIQUE ("projectId", "tryNumber");

-- 11. TryTestResult 테이블 삭제
DROP TABLE IF EXISTS "TryTestResult";

-- 12. TryMark 테이블 삭제
DROP TABLE IF EXISTS "TryMark";

-- 13. groupId FK 제거 후 컬럼 삭제
ALTER TABLE "FormulaTry" DROP CONSTRAINT IF EXISTS "FormulaTry_groupId_fkey";
ALTER TABLE "FormulaTry" DROP COLUMN IF EXISTS "groupId";

-- 14. ExperimentGroup 테이블 삭제
DROP TABLE IF EXISTS "ExperimentGroup";

-- 15. TryMarkType enum 삭제
DROP TYPE IF EXISTS "TryMarkType";

-- 16. Product에 sourceTryId 컬럼 추가
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sourceTryId" TEXT;
ALTER TABLE "Product"
  ADD CONSTRAINT "Product_sourceTryId_fkey"
  FOREIGN KEY ("sourceTryId") REFERENCES "FormulaTry"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
