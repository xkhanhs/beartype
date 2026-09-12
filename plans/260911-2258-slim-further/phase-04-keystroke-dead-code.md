# Phase 4: Code chết trong đường xử lý phím

CLAUDE.md cho phép bỏ code chết trong đường xử lý phím. Mỗi cụm một commit,
người dùng gõ thử sau từng commit (hoặc ít nhất trước khi merge) để còn
`git bisect`.

## Commit 4a: bỏ ngang bằng Shift+Enter

- `input/handlers/keydown.ts` 22-48: `canQuickRestart` luôn đúng (thời gian
  tối đa 120, số từ tối đa 100, bài luyện chép các độ dài đó), nên nhánh bỏ
  ngang không bao giờ chạy. Xoá nhánh và lời gọi thông báo trong đó (nếu phase
  2d chưa xoá).
- Kéo theo: `result.bailedOut` và mọi chỗ đọc/ghi; `canQuickRestart` và
  `utils/quick-restart.ts` nếu hết người dùng. Sau commit này phase 6a xoá
  được `resultCanGetPb`.

## Commit 4b: chữ đang dựng không ai đọc

- `getCompositionText`/`setCompositionText` (`states/test.ts:60`,
  `input/.../composition.ts` 47, 64): chỉ ghi, không đọc.

## Commit 4c: nhánh con trỏ không dùng

- `elements/caret.ts` (~216, 284, 346-395): nhánh `isFullWidth`,
  `"underline"`, `"off"`. Con trỏ chỉ tạo một lần với `"default"`
  (`test/caret.ts:57`), `setStyle` không được gọi từ ngoài.
- Code này định vị con trỏ ở mọi phím: chỉ xoá nhánh, không sắp lại phép tính.

## Kiểm tra
Pre-push. `pnpm dev`: bài time 15s và words 10 tiếng Việt/tiếng Anh, con trỏ
mượt ở cả bốn mức `smoothCaret`, xuống dòng và cuộn dòng đúng, Shift+Enter
không làm gì lạ, Tab/Enter khởi động lại như cũ. Người dùng gõ thử xác nhận.

## Rủi ro
Cao: đây là lõi gõ. Chỉ xoá code đã chứng minh không chạy.
