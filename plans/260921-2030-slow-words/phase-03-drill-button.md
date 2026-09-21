# Phase 3: Nút luyện từ chậm

## File

- Sửa: `src/ts/test/practise-words.ts`, `src/ts/events/test.ts`,
  `src/ts/test/test-logic.ts` (nhánh `restart`)
- Sửa: `src/ts/components/beartype/MissDrillButton.tsx` → dùng chung cho hai
  loại bài luyện
- Sửa: `src/ts/components/mount.tsx`, `src/html/pages/test.html`,
  `src/html/pages/test-result.html`
- Sửa: `src/ts/beartype/strings.ts`

## Việc

1. **Loại bài luyện.** `practise-words.ts` giữ một signal
   `drillKind: "miss" | "slow" | null`, ghi cùng chỗ với `before.mode`.
   `continueDrill()` dựng lại bài theo đúng loại đang chạy: `missWords`, hay
   `slowWords` theo `Config.language`. `resetBefore()` xoá cả loại.
2. **Event restart.** Đổi `practiseMissed?: boolean` thành
   `practise?: "miss" | "slow"`, giữ nguyên `leaveDrill`. Sửa hết các chỗ dùng
   (`restart` trong `test-logic.ts`, nút).
3. **Nút.** Tách phần thân của `MissDrillButton` thành `DrillButton` nhận
   `kind`, sổ, icon và các chuỗi. Hai nút mount riêng (`missdrill`,
   `slowdrill`), đứng cạnh nhau ở cả `test.html` và `test-result.html`. Một nút
   chỉ bật (`bt-action-on`, icon dấu X) khi **đúng loại của nó** đang chạy.
   Nút kia vẫn bấm được và chuyển thẳng sang loại bài luyện của nó.
4. **Icon.** Lấy từ `@mdi/js` của keybear, viết thẳng thành path như
   `TARGET_ICON`. Chọn một icon đọc ra được "chậm", ví dụ `mdiSpeedometerSlow`
   hoặc `mdiTimerSand`. Chốt khi xem trên màn.
5. **Chuỗi**, cả `vi` và `en` trên cùng một dòng trong `strings.ts`: bong bóng
   khi sẵn sàng (có số từ), khi chưa đủ từ, khi đang chạy. Dùng chung ngưỡng
   `MIN_DRILL_WORDS`.

## Kiểm

- Test cho `continueDrill` theo từng loại, nếu dựng được mà không cần DOM.
  Không dựng được thì kiểm trong trình duyệt.
- Trình duyệt, với `localStorage` đã seed: hai nút đứng cạnh nhau; bấm nút
  từ chậm thì bài chỉ có từ trong sổ; bấm lại thì thoát về cài đặt cũ; đang
  luyện từ sai mà bấm nút từ chậm thì đổi loại. Kiểm cả khung hẹp, vì media
  query của `#result .wrapper` chỉ lộ ra ở đó (xem quy ước trong `CLAUDE.md`).

## Rủi ro

`restart` đang có nhánh "vẫn ở trong bài luyện trừ khi `leaveDrill`". Đổi tên
cờ mà sót một chỗ thì bài luyện kẹt lại hoặc tự tắt. Grep lại `practiseMissed`
cho đến khi không còn chỗ nào.
