---
phase: 1
title: "Nhập code và ghim upstream"
status: completed
priority: P1
effort: "2h"
dependencies: []
---

# Phase 1: Nhập code và ghim upstream

## Overview
Đưa code monkeytype vào `beartype` thành **một commit**, từ một SHA ghim, chạy
được dev server, và ghi lại mốc cảm giác gõ của bản gốc trước khi xoá gì.

## Requirements
- Code là bản chép nguyên của một SHA upstream, không lịch sử.
- Dev server chạy ở cổng cố định **3200** với `strictPort` (keybear giữ 3100;
  3000 trên máy này đã có service worker cũ bám vào).
- Bộ test frontend xanh trước khi xoá gì — đó là đường cơ sở.

## Implementation Steps
1. `git -C ~/Documents/GitHub/monkeytype pull` rồi lấy SHA mới nhất (bản local
   hiện ở `91bd24b`, 2026-08-15 — cũ gần một tháng). Ghi SHA + ngày.
2. `git -C ~/Documents/GitHub/monkeytype archive <SHA> | tar -x -C ~/Documents/GitHub/beartype`
   — `archive` chỉ lấy file được track, không kéo `node_modules` hay `.git`.
3. `docs/upstream.md`: SHA, ngày, lệnh để diff một file với upstream
   (`git -C ../monkeytype diff <SHA>:frontend/src/ts/test/test-ui.ts ...`), và
   danh sách file "không được sửa" ở plan.md.
4. `pnpm install`, `pnpm dev-fe` (sửa `vite.config.ts`: `server.port = 3200`,
   `strictPort: true`). Frontend monkeytype chạy được khi không có backend — xác
   nhận bằng cách gõ một bài.
5. `pnpm test-fe` — ghi số test xanh vào `docs/upstream.md`.
6. `CLAUDE.md` cho repo mới: stack (SolidJS + legacy vanilla, Vite, pnpm, Tailwind),
   danh sách file cấm sửa, cổng 3200, cổng kiểm "vẫn gõ y hệt".
7. Commit: `chore: import monkeytype at <SHA>`. Commit plan riêng sau đó.

## Success Criteria
- [ ] Gõ được một bài trên `http://localhost:3200`.
- [ ] Test frontend xanh, số lượng đã ghi lại.
- [ ] `docs/upstream.md` có SHA.

## Risk Assessment
- Frontend có thể treo khi gọi API backend không tồn tại (fetch version,
  firebase init). Nếu có, chỉ ghi lại — phase 2 xoá chúng.
- `pnpm` bắt buộc (`preinstall: only-allow pnpm`). Cloudflare Pages hỗ trợ pnpm
  qua trường `packageManager` — kiểm ở phase 7.
