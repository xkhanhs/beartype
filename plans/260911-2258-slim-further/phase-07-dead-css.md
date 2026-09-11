# Phase 7: CSS chết

Selector cho phần tử không tồn tại ở `src/html` và `src/ts` (class=, classList,
addClass, chuỗi template). Grep lại từng selector trước khi xoá.

## Commit 7a: ngoài vùng gõ (~700 dòng)

- `core.scss` (~210): biến `--crt-*`, `.devIndicator`, `.inputAndIndicator`,
  `.avatar`, `.badge`, `.notificationBubble`, `#fpsCounter`,
  `.headerSorted`/`td.sortable`, `kbd`, `.modal`. **Giữ** `.ffscroll` (`html`
  `@extend` nó) và biến `--balloon-*` (balloon-css đọc).
- `test.scss` ngoài vùng gõ (~100): `.highlightContainer`, `.ssWatermark`,
  `#result.noBalloons`, `.subgroup`, `.dailyLeaderboard`, `.burst`,
  `.testType`, `.leaderboards .lbChange`, `#retrySavingResultButton` (và dòng
  `result.ts:371` ẩn nó).
- `inputs.scss` (~100): checkbox, color, number, select, `.textareaWithCounter`.
  **Giữ** rule gốc `input, textarea` và `textarea {resize}`: chúng style
  `#wordsInput`.
- `media-queries-*.scss` (~110): `.testActivity`, `.pageLogin`, `.ad`,
  `.popupWrapper`, `.modalWrapper .modal`, `.withLabel`; file gray chỉ còn
  comment → xoá file và dòng import. Giữ `.content-grid` và
  `.pageTest #result`.
- `animations.scss` (~105): `accountRowHighlight`, `rgb-bg`, `scanline`,
  `flashBorder`, `gold-shimmer`, `flashKey` (Keymap có hàm cùng tên, không
  dùng keyframe), `shake` + `.animate-shake`, `ring-flash` +
  `.settings-highlight`, `loader` bản scss (trùng bản `tailwind.css`). **Giữ**
  `fadeIn`, `caretFlash*`, `loader` của Tailwind.
- `buttons.scss` (~60): `.button`, `.textButton`, `.fullWidth`, `.circle`,
  `.far/.fab/.icon`, `.active/.danger/.disabled` trên nút. **Giữ** `button.text`
  và `[disabled]`.
- `tailwind.css`: `@utility` không dùng (`rounded-double`, `rounded-half`,
  `text-em-*`), `.autofill-fix`, `.darkMode input[type=date]`,
  `.has-button:p-0`.

## Commit 7b: vùng gõ (~28 dòng, commit riêng)

- `test.scss`: `letter.debugCaret*`, `.corrected`, `.extraCorrected`,
  `.missing`, `.word.nocursor`, `#words.noErrorBorder`. Chữ chỉ nhận class ở
  `beartype/word-html.ts` 42-58 và `test-ui.ts`.

## Kiểm tra
Pre-push, `pnpm lint-styles`. `pnpm dev` ở khung rộng, 768px và 375px (media
query chỉ lộ ở khung hẹp): bài gõ, màn kết quả, sổ bài gần đây, thẻ cài đặt,
chọn theme. So ảnh chụp trước/sau. Với 7b: gõ sai, gõ thừa, xoá lùi, chữ đang
dựng dấu — màu và gạch chân như cũ.

## Rủi ro
7a thấp; 7b trung bình (selector vùng gõ), nên tách commit.
