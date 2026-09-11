---
phase: 6
title: "Âm thanh và bàn phím ảo"
status: pending
priority: P2
effort: "5h"
dependencies: [5]
---

# Phase 6: Âm thanh và bàn phím ảo

## Overview
Hai tính năng người dùng muốn giữ. Âm thanh còn code (`sound-controller.ts`) nhưng
file `.wav` đã bị xoá lúc fork. Bàn phím ảo đã bị gỡ hẳn, chép lại từ upstream
(`~/Documents/GitHub/monkeytype`, SHA `91bd24bb`). Cả hai bật/tắt trong thẻ cài
đặt (`SettingsPopover.tsx`), cùng kiểu với con trỏ mượt và phông.

## Âm thanh
- Chép từ `monkeytype/frontend/static/sounds/` khoảng sáu bộ tiếng gõ: `click1`
  (click), `click3` (pop), `click4` (nk creams), `click5` (typewriter), `click6` (osu),
  và một tiếng synth (`8`, sine, không cần file). Tên lấy từ `configMetadata` của upstream.
  Chốt danh sách cuối khi nghe thử; tổng file khoảng 1 MB.
- Tiếng báo gõ sai: một tiếng (`error1`), bật/tắt.
- Âm lượng: thanh trượt `soundVolume`.
- Bỏ tiếng báo sắp hết giờ, `fart-reverb`, bộ scale nốt nhạc, trừ khi người dùng đổi ý.
- `sound-controller.ts`: chỉ nạp bộ đang chọn, và chỉ nạp khi bật (không tải gì
  với người để tắt). `constants/sounds.ts` rút về đúng các bộ còn giữ.
- Config: `playSoundOnClick` (off + các bộ giữ), `playSoundOnError` (off/on),
  `soundVolume` thêm vào `USER_KEYS`; mặc định vẫn tắt.
- Chữ trong cài đặt bằng tiếng Việt, cùng giọng với các hàng hiện có.

## Bàn phím ảo
- Chép `components/pages/test/Keymap.tsx`, `keymapConverter.ts`, `keymapLayouts.ts`
  của upstream; chỉ giữ QWERTY (`static/layouts/qwerty.json` còn từ phase 1),
  kiểu `staggered`, chế độ `react` (phím sáng khi nhấn). Bỏ nhánh `next`, `static`,
  `matrix`/`split`, legend style, `showCommandLineForConfig`.
- Mount dưới `#wordsWrapper` trong `test.html`, ẩn trên màn kết quả.
- Nghe `keydown`/`keyup` (qua `events/keymap.ts` đang còn). Vì chỉ nhìn `event.code`,
  gõ Telex của máy vẫn sáng đúng phím vật lý, cả tiếng Việt lẫn tiếng Anh.
- Màu lấy từ biến theme; thử cả chín theme.
- Config: `keymapMode` (`off` | `react`) thêm vào `USER_KEYS`, mặc định `off`.

## Phím gõ sai dưới chữ
- `indicateTypos`: chỉ còn `off` | `below`, thêm vào `USER_KEYS`, **mặc định `below`**.
  Code vẽ `.hints` trong `test-ui.ts` giữ lại ở phase 3 (bỏ nhánh `replace`/`both`).
- Kiểm với tiếng Việt: beartype vẽ từ đang gõ bằng `beartype/word-html.ts`, không
  qua đường vẽ của upstream; phím sai phải hiện đúng dưới chữ đích, kể cả khi đang
  dựng dấu dở (chữ `partial` không phải lỗi, không được hiện gợi ý).
- Hàng trong thẻ cài đặt: "hiện phím gõ sai".

## Related Code Files
- Create: `src/ts/components/pages/test/Keymap.tsx` (+ hai file đi kèm, gọn lại), `static/sounds/**`
- Modify: `src/ts/controllers/sound-controller.ts`, `src/ts/constants/sounds.ts`,
  `src/ts/components/beartype/SettingsPopover.tsx`, `src/ts/beartype/config-lock.ts`,
  `src/ts/constants/default-config.ts`, `src/ts/schemas/configs.ts`,
  `src/ts/components/mount.tsx`, `src/html/pages/test.html`, `src/styles/beartype.scss`
- Test: `__tests__/beartype/config-lock.spec.ts` (khoá mới, giá trị lạ bị bỏ)

## Success Criteria
- [ ] Bật tiếng gõ: mỗi phím một tiếng, gõ nhanh không trễ hay nghẹt; tắt thì không tải file âm thanh nào (Network).
- [ ] Bàn phím ảo sáng đúng phím khi gõ Telex tiếng Việt và khi gõ tiếng Anh.
- [ ] Lựa chọn giữ qua lần tải lại; test config-lock phủ khoá mới.

## Risk Assessment
- Âm thanh phát trong đường xử lý phím (`test-ui.ts` gọi `playClick`). Phải giữ nó
  bất đồng bộ, không để việc nạp file chặn keydown; đo bằng cách gõ nhanh khi bật.
- Keymap cập nhật DOM mỗi phím; dùng signal Solid như upstream, không đụng caret.
