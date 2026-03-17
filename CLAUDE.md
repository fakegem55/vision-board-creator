# CLAUDE.md — Vision Board Creator

AI 협업 규칙 문서. 이 파일은 Claude Code가 프로젝트 전반에서 일관된 방식으로 작동하기 위한 기준입니다.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS (모바일 퍼스트) |
| Image API | Unsplash API (Next.js API Route로 키 보호) |
| Export | html-to-image (PNG 변환) |
| Share | Web Share API (navigator.share) |
| Testing | Jest + React Testing Library |
| Package Manager | npm |

> **Backend 없음**: DB, 서버 사이드 저장 없음. 저장=PNG 다운로드, 공유=Web Share API.

---

## 커밋 메시지 규격

**Conventional Commits** 스타일을 따른다.

```
<type>(<scope>): <subject>
```

| type | 사용 시점 |
|------|----------|
| `feat` | 새로운 기능 |
| `fix` | 버그 수정 |
| `test` | 테스트 추가/수정 |
| `refactor` | 동작 변경 없는 코드 개선 |
| `style` | 포매팅, 세미콜론 등 |
| `docs` | 문서 변경 |
| `chore` | 빌드, 설정 변경 |

예시:
```
feat(keyword): add tag-style keyword input with max 10 limit
fix(export): handle html-to-image CORS on mobile Safari
test(layout): add unit tests for grid layout engine
```

---

## 코드 스타일

- **함수는 가급적 20줄 이내로 유지한다.** 길어지면 보조 함수로 분리.
- TypeScript strict mode (`noImplicitAny: true`, `strictNullChecks: true`)
- 컴포넌트 파일은 PascalCase, 유틸/훅은 camelCase
- `any` 타입 사용 금지 — 불가피한 경우 주석으로 이유 명시
- 파일당 단일 책임 원칙

---

## 테스트 코드 구현

- **매 기능 구현에 맞는 테스트 코드를 작성한다.**
- 모든 신규 및 수정 사항은 `npm test`를 통과한 후에만 **완료**로 간주한다.
- 테스트 파일 위치: `__tests__/` 하위 또는 모듈 옆 `*.test.ts(x)`
- 외부 API(Unsplash)는 mock 처리

---

## AI 협업 원칙

1. 기능 구현 전 REQUIREMENTS.md의 Acceptance Criteria를 확인한다.
2. 구현 완료 후 해당 AC를 체크(✅)한다.
3. `npm test` 실패 시 구현 완료로 보지 않는다.
4. 한 기능이 완성될 때마다 **Vibe Check**: 요구사항과 일치하는지 검토한다.
5. 과도한 추상화 지양 — 지금 필요한 것만 구현한다.
