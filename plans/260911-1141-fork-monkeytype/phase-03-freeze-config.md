---
phase: 3
title: "Khoá cấu hình, chỉ còn chế độ, ngôn ngữ và một ô cài đặt nhỏ"
status: pending
priority: P1
effort: "1d"
dependencies: [2]
---

# Phase 3: Khoá cấu hình

## Overview
Monkeytype có ~100 khoá cấu hình. Code test đọc chúng khắp nơi (`Config.stopOnError`,
`Config.mode === "zen"`, ...). **Không xoá các nhánh `if` đó** — sửa `test/` là
đúng thứ mình đang tránh. Thay vào đó khoá `Config` ở một bộ giá trị cố định và
chỉ để người dùng đổi vài thứ.

## Requirements

**Trên thanh chọn của màn test:** `mode` (`time` | `words`), `time`
(15/30/60/120), `words` (10/25/50/100), `language` (tiếng Việt | English).

**Trong ô cài đặt** (bánh răng ở chân trang, mở một popover nhỏ — không phải
trang cài đặt của monkeytype):

| Khoá | Lựa chọn | Mặc định | Vì sao |
|------|----------|----------|--------|
| `theme` | các chủ đề keybear (phase 6) | theo máy (sáng/tối) | anh chọn |
| `smoothCaret` | off / slow / medium / fast | **slow** | cài đặt anh đang dùng trên monkeytype.com |
| `paceCaret` | off / average / pb / last | **average** | cài đặt anh đang dùng; `tagPb`, `daily`, `custom` bỏ vì cần tag/tài khoản hoặc thêm ô nhập |

**Mọi khoá khác cố định.** Giá trị lấy theo **cài đặt monkeytype.com của anh**,
không phải mặc định của họ — cảm giác anh nhớ là cảm giác với cấu hình đó. Đã
biết từ ảnh chụp 2026-09-11: `smoothCaret=slow`, `caretStyle=default`,
`paceCaret=average`. Còn phải chép trước khi làm phase này: `smoothLineScroll`,
`fontSize`, `fontFamily`, `showAllLines`, `tapeMode`, `blindMode`,
`indicateTypos`, `hideExtraLetters`, `liveSpeedStyle`, `liveAccStyle`,
`timerStyle`, `highlightMode`, `paceCaretStyle`. Cách nhanh nhất: monkeytype.com
→ settings → "export" chuỗi cấu hình JSON, dán vào `config/beartype-lock.ts`.

Riêng những khoá mà beartype không có tính năng đi kèm thì ép: `punctuation=false`,
`numbers=false`, `funbox=[]`, `keymapMode="off"`, `playSoundOnClick="off"`,
`quickRestart="tab"` (Tab → bài mới), `showKeyTips=false`.

- Lưu trong `localStorage` như monkeytype đang làm (`config/persistence.ts`).
  Khi đọc lên, **mọi khoá ngoài danh sách người dùng đổi được bị ghi đè** — một
  localStorage cũ hay một URL `?config=` không được mở lại tính năng đã khoá.
- Không commandline (Esc / Ctrl+Shift+P không mở gì).

## Pace caret với WPM theo phím
`pace-caret.ts` đi với tốc độ **ký tự**/giây (`wpm * 5 / 60`). Beartype tính WPM
theo **phím** (phase 4), nên với tiếng Việt một con trỏ nhịp chạy theo ký tự sẽ
chạy nhanh hơn người gõ đúng bằng mức WPM đã phồng lên. Phase 4 sửa chỗ này: con
trỏ nhịp bước qua mỗi chữ mất `keyCost(chữ)` phần thời gian, không phải một.
"average" lấy trung bình 10 bài gần nhất **trên máy** (phase 5), cùng chế độ +
ngôn ngữ — thay `getUserAverage10Once` (đọc snapshot tài khoản).

## Architecture
- `config/beartype-lock.ts`: `LOCKED: Partial<Config>` và
  `USER_KEYS = ["mode","time","words","language","theme","smoothCaret","paceCaret"]`.
  Móc vào `loadFromLocalStorage` và `url-handler` (hoặc xoá hẳn `url-handler`).
- `components/beartype/SettingsPopover.tsx`: ba hàng, mỗi hàng một dãy viên
  thuốc, ghi thẳng qua `setConfig` của monkeytype (nó đã phát sự kiện để caret
  và pace caret tự áp dụng).
- Thanh chọn (`TestConfig.tsx`) gọt còn chế độ, mốc và ngôn ngữ.

## Related Code Files
- Create: `config/beartype-lock.ts` + test, `components/beartype/SettingsPopover.tsx`
- Modify: `config/lifecycle.ts` (một lời gọi), `components/pages/test/TestConfig.tsx`,
  `test/pace-caret.ts` (nguồn WPM "average", chỉ khối `// beartype:`)
- Delete: `config/remote.ts` nếu phase 2 còn sót

## Success Criteria
- [ ] Đặt `localStorage` có `stopOnError:"letter"` rồi reload: gõ sai vẫn đi
      tiếp (khoá thắng).
- [ ] Đổi smooth caret sang fast giữa hai bài: bài sau con trỏ trượt nhanh hơn,
      reload vẫn còn.
- [ ] Pace caret "average" hiện sau bài thứ nhất, tắt được.
- [ ] Cổng "vẫn gõ y hệt".

## Risk Assessment
- Chưa chép đủ cấu hình của anh thì cổng "vẫn gõ y hệt" sẽ đỏ vì lý do sai — so
  cấu hình trước khi đổ lỗi cho code.
