# LEGACY — `specs/` feature folders

**This tree is historical reference only.** The source of truth for product behavior is now **`openspec/`** (main specs under `openspec/specs/`, change proposals under `openspec/changes/`).

Do not extend these dated feature folders with new requirements. Propose and ship new work through OpenSpec.

## Mapping: old folders → OpenSpec domains

| Legacy folder | OpenSpec domain |
|---------------|-----------------|
| `2026-05-11-llm-risk-scoring/` | `openspec/specs/risk-scoring/` |
| `2026-05-12-llm-recommendations/` | `openspec/specs/recommendations/` |
| `2026-05-12-doctor-ui-role-nav/` | `openspec/specs/role-navigation/` |
| `2026-05-13-chatbot-basic/` | `openspec/specs/chatbot/` (merged; current behavior is RAG) |
| `2026-05-15-chatbot-rag/` | `openspec/specs/chatbot/` |
| `2026-05-13-ehr-summarization/` | `openspec/specs/ehr-summarization/` |
| `2026-05-13-abnormality-flagging/` | `openspec/specs/abnormality-flagging/` |
| `2026-06-13-personalized-plans/` | `openspec/specs/personalized-plans/` |
| `2026-06-13-async-forecasting/` | `openspec/specs/health-forecasting/` |
| `2026-06-13-periodic-resubmit/` | `openspec/specs/periodic-resubmit/` |
| `2026-06-13-health-assessment-report/` | `openspec/specs/health-assessment-report/` |

Archived historical change notes live under `openspec/changes/archive/<legacy-folder-name>/`.

Mission / roadmap / tech-stack docs in this directory (`mission.md`, `roadmap.md`, `tech-stack.md`) remain useful project context; checklist items for Phase 1–2 map to the OpenSpec domains above.
