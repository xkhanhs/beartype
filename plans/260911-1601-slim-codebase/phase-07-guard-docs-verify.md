---
phase: 7
title: "knip, tài liệu, nghiệm thu"
status: in-progress
priority: P2
effort: "2h"
dependencies: [6]
---

# Phase 7: knip, tài liệu, nghiệm thu

## Requirements
- **knip ở pre-push**: `.husky/pre-push` thành `pnpm ts-check && pnpm knip && pnpm test && pnpm build`.
  `knip.json` chỉ khai những entry thật (`src/ts/index.ts`, `index.html`, `scripts/build-vietnamese.ts`,
  `vite-plugins/*`). Không dùng `ignore` để lấp chỗ báo thật.
- Bỏ bí danh `build-fe` sau khi Cloudflare đã đổi sang `pnpm build`.
- **Tài liệu**:
  - `CLAUDE.md`: bỏ đoạn "không sửa file cảm giác gõ" và mọi đường dẫn `frontend/`;
    cập nhật lệnh chạy (không còn `build-pkg`), cấu trúc thư mục, quy ước "dọn theo cụm,
    mỗi cụm một commit" giữ lại. Ghi âm thanh và bàn phím ảo vào mục code beartype.
  - `docs/upstream.md`: rút còn nguồn gốc (SHA, ngày, giấy phép) và cách lấy một file từ
    upstream khi cần (như lúc chép keymap/âm thanh). Bỏ danh sách file cấm và bảng
    "chỗ đã sửa trong lõi".
  - `README.md`: lệnh chạy, cấu trúc.
  - Memory `worktree-node-commands`: đường dẫn `cd frontend` không còn đúng, sửa lại.
- **Số liệu**: đo lại như bảng đầu `plan.md` (số file/dòng TS, test, kích thước `dist`
  và JS) và ghi vào mô tả PR.

## Steps
1. Chạy đủ pre-push một lần ở clone sạch (`git clone` worktree ra scratchpad, `pnpm install`).
2. Gõ thử theo checklist ở `plan.md`, cả chín theme lướt qua.
3. Review diff theo commit (dùng code-reviewer cho phase 3 vì rủi ro cảm giác gõ cao nhất).

## Success Criteria
- [ ] Mọi mục trong "Tiêu chí nghiệm thu" của `plan.md` được đánh dấu.
