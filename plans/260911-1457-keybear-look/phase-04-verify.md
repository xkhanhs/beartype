---
phase: 4
title: "Kiểm tra"
status: pending
priority: P1
effort: "1h"
dependencies: [2, 3]
---

# Phase 4: Kiểm tra

## Implementation Steps
1. `pnpm vitest run __tests__/beartype` rồi `pnpm test-fe`.
2. `pnpm oxlint --type-aware --type-check --format agent`.
3. `pnpm build-fe`.
4. Mở dev server của worktree (cổng 3201; 3200 là của checkout chính), xem ở
   1280×800 và 375×812: trang chính, cài đặt, danh sách màu, kết quả (0 bài, 1 bài,
   ≥5 bài) — với màu sáng (ban ngày), tối (ban đêm), `racing`.
5. Ghi vào `docs/upstream.md` nếu có chạm file lõi (dự kiến: không).

## Success Criteria
- [ ] Mọi mục trong "Tiêu chí nghiệm thu" của plan.md đạt.
