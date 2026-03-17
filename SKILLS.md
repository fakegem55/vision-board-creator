# SKILLS.md — Vision Board Creator

Claude Code 커스텀 스킬 목록. 현재 v1에서는 별도 스킬이 없습니다.

---

## 현재 등록된 스킬

없음.

---

## 추천 스킬 후보 (필요 시 추가)

아래는 이 프로젝트에 유용할 수 있는 스킬입니다. 필요해지는 시점에 추가하세요.

### 1. `/vibe-check` — 요구사항 정합성 검토
기능 구현 후 REQUIREMENTS.md의 Acceptance Criteria와 현재 코드를 비교하여
통과/미통과 항목을 표로 출력하는 스킬.

**추가 시점**: 기능이 3개 이상 구현된 후

---

### 2. `/export-schema` — Prisma 스키마 요약 출력
현재 `prisma/schema.prisma`를 읽어 테이블·필드·관계를 마크다운 표로 요약.

**추가 시점**: 스키마가 자주 변경되기 시작할 때

---

### 3. `/add-story` — User Story 템플릿 추가
REQUIREMENTS.md에 표준 형식의 User Story 초안을 자동 추가.

**추가 시점**: 신규 요구사항이 자주 추가될 때

---

> 스킬 추가가 필요하면 이 파일을 업데이트하고 `.claude/commands/` 디렉토리에 스킬 파일을 생성합니다.
