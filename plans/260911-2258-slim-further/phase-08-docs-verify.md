# Phase 8: Docs và kiểm tra cuối

## Docs
- `CLAUDE.md`:
  - mô tả `SettingsPopover` (bỏ phông, tiếng gõ, tiếng báo sai, âm lượng);
  - xoá đoạn "Âm thanh";
  - đoạn phông: Roboto Mono cho tiếng Anh, Be Vietnam Pro cho tiếng Việt, cố
    định theo ngôn ngữ;
  - quy ước icon: bỏ FontAwesome và `fontawesome-subset`, mô tả sprite
    `src/html/icons.html` và `Icon.tsx`; icon `bt-action` (MDI) giữ nguyên hay
    chuyển vào sprite — ghi đúng cái đã làm.
- `README.md`: tính năng (bỏ âm thanh, bộ chọn phông), mục "Giấy phép" (bỏ
  keybr/AGPL của tiếng phím, thêm Lucide/Feather/simple-icons).
- `docs/upstream.md`: ghi lượt này bỏ gì so với upstream.
- `plan.md` này: điền số liệu thật, đổi `status`.

## Kiểm tra cuối
1. `pnpm ts-check && pnpm knip && pnpm test && pnpm build` xanh.
2. Đo lại: dòng `src/`, dòng `__tests__/`, `du -sh static dist`, kích thước JS.
3. Chạy knip không tính test (cấu hình ở phase 2) → chỉ còn các seam test đã
   chốt giữ.
4. `pnpm dev`, kiểm bằng trình duyệt: khung rộng và 375px; tải lại nguội ở bài
   tiếng Việt; phá kỷ lục thấy vương miện và pháo giấy; luyện từ hay sai;
   `localStorage` cũ (có âm thanh, `fontFamily`, `themeLight`) nạp được.
5. Người dùng gõ thử cả hai ngôn ngữ và xác nhận cảm giác gõ không đổi.
6. PR vào `main` (push lên `main` là deploy). Không `--no-verify`.
