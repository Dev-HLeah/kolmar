# S38 기준 제품 처방의 기준 Try 복사 계획

## 목표
- 기존 제품을 기준으로 프로젝트를 시작할 때 선택한 제품의 처방을 프로젝트 첫 기준 Try로 복사한다.
- 연구자가 신규 프로젝트 상세로 들어갔을 때 기준 배합을 바로 보고 수정할 수 있게 한다.

## 범위
- 제품 목록 응답의 첫 처방과 원료를 프로젝트 생성 화면에서 보관
- 프로젝트와 실험 그룹 생성 후 `try#1` 기준 Try 생성
- 기준 Try 제목은 `기준 처방`, 메모는 원본 제품명을 포함한 복사 안내로 저장
- 원료명, 함량, 단위, 비율, 역할을 Try 원료 입력 구조로 매핑
- 처방이 없는 기준 제품 또는 `선택 안 함`은 기존처럼 Try를 생성하지 않음

## 제외
- try#1~100 자동 생성
- 여러 처방 버전 선택 UI
- 원본 제품과 Try 사이의 별도 DB 관계 추가
- API 엔드포인트 변경

## 구현 순서
1. 웹 프로젝트 생성 테스트에 기준 Try 복사 기대값 추가
2. 실패 테스트 확인
3. 프로젝트 생성 성공 후 기준 Try 생성 호출 추가
4. 전체 웹 검증
5. 한국어 커밋 메시지로 커밋 및 푸시

## 진행 상태
- [x] 웹 실패 테스트 추가
- [x] 실패 테스트 확인
- [x] 웹 구현
- [x] 전체 웹 검증

## 성공 기준
- 기준 제품에 처방이 있으면 프로젝트 생성 시 `POST /projects/groups/:groupId/tries`가 한 번 호출된다.
- 생성되는 Try는 `tryNumber: 1`, `title: 기준 처방`을 가진다.
- 제품 처방 원료가 Try 원료 payload로 복사된다.
- 처방이 없는 기준 제품은 기존처럼 Try를 자동 생성하지 않는다.

## 검증
- RED: `npm --workspace apps/web run test -- ProjectsPage.test.tsx`에서 기준 Try 생성 호출이 없어 실패
- GREEN: `npm --workspace apps/web run test -- ProjectsPage.test.tsx`
- Regression: `npm run lint:web`
- Regression: `npm --workspace apps/web run test`
- Regression: `npm run build:web`
- Browser: `http://127.0.0.1:4173/projects`에서 프로젝트 생성 화면과 기준 제품 선택 UI 렌더링 확인, 콘솔 오류 0건
