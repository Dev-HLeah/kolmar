# S39 대시보드 현황 수치 API 연결 계획

## 목표
- 연구 대시보드 상단 업무 현황을 실제 API 데이터 기반으로 표시한다.
- 사용자가 첫 화면에서 등록 제품, 프로젝트, Try, 수집 근거 규모를 바로 파악하게 한다.

## 범위
- `/products` 응답 개수로 `등록 제품` 표시
- `/projects` 응답 개수로 `진행 프로젝트` 표시
- `/projects`의 그룹별 Try 개수 합으로 `계획 Try` 표시
- `/evidence/import-jobs`의 원본 기록 개수 합으로 `근거 자료` 표시
- API 장애 시 기존 0 값을 유지

## 제외
- 대시보드 전용 API 추가
- 실시간 polling
- 권한별 지표 차등 표시
- 근거 아이템 전체 목록 API 추가

## 구현 순서
1. 웹 대시보드 실패 테스트 추가
2. 실패 테스트 확인
3. 대시보드 API 현황 로딩 구현
4. 전체 웹 검증
5. 한국어 커밋 메시지로 커밋 및 푸시

## 진행 상태
- [x] 웹 실패 테스트 추가
- [x] 실패 테스트 확인
- [x] 웹 구현
- [x] 전체 웹 검증

## 성공 기준
- 제품 API 2건이면 `등록 제품` 지표가 2로 표시된다.
- 프로젝트 API 2건이면 `진행 프로젝트` 지표가 2로 표시된다.
- 프로젝트 그룹 내 Try 합계가 `계획 Try`로 표시된다.
- 수집 작업의 원본 기록 합계가 `근거 자료`로 표시된다.

## 검증 기록
- RED: `npm --workspace apps/web run test -- DashboardPage.test.tsx` 실패 확인
  - API 응답을 준비해도 대시보드 수치가 모두 0으로 표시되는 상태 확인
- GREEN: `npm --workspace apps/web run test -- DashboardPage.test.tsx` 통과
- 회귀 검증: `npm run lint:web` 통과
- 회귀 검증: `npm --workspace apps/web run test` 통과
- 빌드 검증: `npm run build:web` 통과
- 브라우저 검증: `http://127.0.0.1:4173/`에서 현황 타일 4개 렌더링 및 콘솔 오류 0건 확인
