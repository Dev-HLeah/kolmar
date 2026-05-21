# S24 기존 제품 기반 프로젝트 시작 계획

## 목표
- 등록된 제품/처방을 신규 프로젝트의 기준 제품으로 선택할 수 있게 한다.
- 제품 상세 화면에서 해당 제품을 기준으로 프로젝트 생성을 시작할 수 있게 한다.
- 프로젝트 생성 요청에 `sourceProductId`와 가능하면 `sourceFormulaId`를 함께 보낸다.

## 범위
- 웹 제품 상세 화면의 프로젝트 시작 링크 추가
- 웹 프로젝트 생성 화면의 기준 제품 목록을 `/products` API로 로드
- URL query `sourceProductId`가 있으면 해당 제품을 기본 선택
- API 장애 시 기존 샘플 기준 제품 fallback 유지

## 제외
- 실제 처방 복제 로직
- Supabase 연결 및 migration
- 프로젝트 상세 화면에서 기준 제품 처방 자동 표시

## 구현 순서
1. 제품 상세 링크 테스트 추가
2. 프로젝트 생성 기준 제품 API 로드 테스트 추가
3. 실패 테스트 확인
4. `ProductDetailPage`에 프로젝트 시작 링크 추가
5. `ProjectsPage`에 제품 목록 로드, query preselect, `sourceFormulaId` 전송 추가
6. 웹/API 전체 검증 및 브라우저 확인
7. 한국어 커밋 메시지로 커밋 및 푸시

## 진행 상태
- [x] 제품 상세 링크 테스트 추가
- [x] 프로젝트 생성 기준 제품 API 로드 테스트 추가
- [x] 실패 테스트 확인
- [x] 제품 상세 링크 구현
- [x] 프로젝트 생성 기준 제품 목록 구현
- [x] 웹/API 린트, 테스트, 빌드 검증
- [x] 로컬 브라우저 화면 검증

## 성공 기준
- 제품 상세의 링크 href가 `/projects?sourceProductId=<productId>` 형태다.
- 프로젝트 생성 화면의 기준 제품 select에 API 제품명이 표시된다.
- query의 `sourceProductId`와 일치하는 제품이 자동 선택된다.
- 프로젝트 생성 요청에 선택된 제품의 첫 번째 formula id가 `sourceFormulaId`로 들어간다.
