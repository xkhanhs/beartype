# Phase 3: Bỏ âm thanh

Hai commit, để `git bisect` tách được phần chạm đường gõ:

- **3a** gỡ phía đường gõ: lời gọi trong `test-ui.ts`, và trong
  `sound-controller.ts` xoá luôn `playClick`, `playError`, `clearAllSounds`
  cùng listener `keydown` toàn cục (109-114, đang chạy ở mọi phím), vì sau khi
  bỏ lời gọi chúng thành export thừa và knip đỏ. Chỉ còn phần nghe thử
  (`previewClick`/`previewError`) cho `SettingsPopover`. Giữa hai commit, gõ
  không có tiếng — chấp nhận trong cùng một PR.
- **3b** gỡ phần còn lại (bảng dưới).

## Commit 3b: gỡ âm thanh khỏi cài đặt và cấu hình

| File | Chỗ | Việc |
|---|---|---|
| `controllers/sound-controller.ts` | cả file (287) | xoá. Kéo theo listener `keydown` toàn cục (109-114) đang chạy ở mọi phím |
| `constants/sounds.ts` | cả file | xoá |
| `static/sounds/` | cả thư mục (620 KB) | xoá |
| `package.json` | `howler`, `@types/howler` | `pnpm remove` |
| `vite.config.ts` | nhóm `vendor-howler` (175-179) | xoá |
| `schemas/configs.ts` | 25-41, 66-69 | xoá schema và khoá `playSoundOnClick`, `playSoundOnError`, `soundVolume` |
| `beartype/config-lock.ts` | import 5-6, USER_KEYS 24-26, `CLICK_SOUNDS`/`ERROR_SOUNDS`, nhánh `soundVolume` trong `allowed` | xoá |
| `constants/default-config.ts` | 18-20 | xoá |
| `config/utils.ts` | 44-50 (migrate) | xoá |
| `config/metadata.tsx` | 106-118 | xoá |
| `components/beartype/SettingsPopover.tsx` | import, nhãn 60-76, ba hàng 153-181, comment 25 | xoá |
| `components/beartype/SettingsSliderRow.tsx` | cả file | xoá (chỉ thanh âm lượng dùng) |
| `styles/beartype.scss` | `.bt-settings-slider` 694-710 | xoá |
| test | `config-lock.spec.ts` 71-112, `utils/config.spec.ts` 64-72 | xoá; thêm ba khoá vào danh sách khoá bị bỏ ở `production-local-storage.spec.ts` 47-59 |

## Commit 3a (làm trước): gỡ lời gọi âm thanh trong đường gõ

- `test/test-ui.ts`: import :17; nhánh âm thanh 784-792; comment :829;
  `clearAllSounds` :937.
- `afterAnyTestInput` (780-783): `type` và `correctInput` hết người dùng →
  bỏ cả hai tham số; ba chỗ gọi 820, 830, 839 thành `afterAnyTestInput()`.
  Phần còn lại giữ nguyên thứ tự: cập nhật độ chính xác (794-797),
  `Focus.set`, `Caret.stopAnimation`, `Caret.updatePosition`. Lời gọi âm thanh
  vốn không chờ (fire-and-forget), nên thứ tự không đổi.
- `afterTestTextInput(correct, …)` (:805): `correct` thành thừa; bỏ và sửa
  `input/handlers/insert-text.ts:179`.
- Dây chuyền knip:
  - `states/modifiers.ts`: `getModifierState` mất người đọc duy nhất → xoá tín
    hiệu shift/alt, `resetModifierState`, khối `createEffectOn` 52-86, import
    5, 7, 8. **Giữ** `isCapsLockOn` (CapsWarning dùng) và
    `@leonabcd123/modern-caps-lock`.
  - `test-logic.ts`: import :94, `resetModifierState()` :178.
  - `hooks/effects.ts` 13-23: `createEffectOn` (người dùng cuối là
    modifiers.ts).

## Kiểm tra
Pre-push. `pnpm dev`: gõ bài tiếng Việt có dựng dấu và bài tiếng Anh, bấm
Caps Lock thấy cảnh báo, không lỗi console. Nạp một `localStorage` cũ có
`playSoundOnClick: "keybear"` → trang lên, cài đặt không còn mục âm thanh.

## Rủi ro
Cao ở `test-ui.ts` (hàm chạy sau mỗi phím). Chỉ xoá, không đổi logic còn lại.
Sau khi bản mới lưu lại cấu hình, lựa chọn âm thanh cũ mất hẳn (chấp nhận).
