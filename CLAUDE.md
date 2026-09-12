# beartype

Đo tốc độ gõ tiếng Việt và tiếng Anh. Khởi đầu là bản fork của monkeytype (xem
[docs/upstream.md](docs/upstream.md)), giờ chỉ còn một màn: bài đo, phân tích
cuối bài và luyện từ hay sai. Giao diện theo keybear
(`~/Documents/GitHub/keybear`), độ chính xác chấm theo keybear. Kế hoạch gần
nhất: [plans/260911-2258-slim-further/plan.md](plans/260911-2258-slim-further/plan.md).

**Lý do repo này tồn tại:** keybear dựng lại màn đo tốc độ theo monkeytype
nhiều lần mà cảm giác gõ vẫn khác. beartype giữ nguyên lõi gõ của monkeytype
(ô nhập, cách vẽ chữ, con trỏ, đồng hồ, cuộn dòng) và chỉ đổi ở những chỗ ghi
trong `docs/upstream.md`. Code không còn bị cấm sửa, nhưng cảm giác gõ vẫn là
thứ quan trọng nhất: trong đường xử lý phím chỉ bỏ code chết hoặc sửa có chủ
đích, không "viết lại cho gọn".

## Chạy

Cần **Node 24**, vì `engineStrict` trong `pnpm-workspace.yaml` chặn Node 26
đang là mặc định của máy. Node 24 đã cài keg-only qua Homebrew, chỉ cần thêm vào
PATH cho từng lệnh:

```bash
export PATH=/opt/homebrew/opt/node@24/bin:$PATH
pnpm install
pnpm test
pnpm dev   # http://localhost:3200
```

**Cổng dev là 3200, và `strictPort` bật.** Cổng 3000 trên máy này còn service
worker của app khác trả lời từ cache. Keybear giữ 3100.

**Một push lên `main` là một lần deploy.** Cloudflare Pages build thẳng từ
nhánh này (`pnpm build`, output `dist`, `NODE_VERSION=24`,
`PNPM_VERSION=11.21.0`), không qua staging. `.husky/pre-push`
chạy ts-check, knip, test và build rồi mới cho push; đừng lách bằng
`--no-verify`. knip báo export không ai import, file và package không ai dùng:
xoá chúng, đừng thêm `ignore` vào `knip.ts`.

## Code nằm ở đâu

Một package duy nhất ở gốc repo: `src/`, `static/`, `__tests__/`,
`vite.config.ts`.

- `src/ts/beartype/`: chấm điểm theo phím (`scoring.ts`, chép từ keybear), kiểu
  bỏ dấu (`vietnamese.ts`, `tone-style.ts`), vẽ từ đang gõ (`word-html.ts`), khoá
  cấu hình (`config-lock.ts`: những khoá người dùng được đổi và giá trị cho
  phép), kết quả lưu trên máy (`local-results.ts`), sổ từ hay sai
  (`miss-book.ts`).
- `src/ts/components/beartype/`: thẻ cài đặt (`SettingsPopover`: con trỏ mượt,
  cỡ chữ, hiện phím gõ sai, xoay màu, bàn phím ảo), viên chọn màu ở chân trang
  (`ThemeMenu`, rê chuột là xem thử), nút luyện từ hay sai, sổ bài gần đây dưới
  màn kết quả (`ResultHistory`), icon (`Icon`).
- Màu: chín bảng của keybear, hai mươi hai bảng tối và bảy bảng sáng chép từ
  monkeytype (`src/ts/constants/themes.ts`, tên trong
  `src/ts/schemas/themes.ts`). Chữ trên nền accent (`--kb-on-accent`) không
  còn mặc định là màu nền: `beartype/contrast.ts` đo và chọn màu đọc được, ưu
  tiên màu nền rồi màu chữ của bảng, cùng lắm mới tới trắng/đen theo hướng
  sáng-tối của bảng. Thêm bảng mới thì `__tests__/beartype/contrast.spec.ts`
  kiểm cho, đừng viết `--kb-on-accent` tay vào file css của bảng. Danh
  sách ở chân trang cắt theo sáng/tối và cuộn được. `randomTheme`
  (`tắt`/`sáng`/`tối`/`lẫn lộn`) cho mỗi bài mới một bảng rút ngẫu nhiên trong
  nhóm đó: `randomizeTheme` trong `controllers/theme-controller.ts`, gọi từ
  `restart` của `test/test-logic.ts`, rút hết một cỗ đã xáo rồi mới xáo lại.
  Bảng đang xoay không ghi vào `Config.theme`, nên tắt xoay là về lại màu đã
  chọn. Mặc định là `auto`: xoay trong nhóm sáng hay tối tuỳ cài đặt của máy.
  Cấu hình lưu từ trước khi có khoá này, của người đã tự chọn màu
  (`autoSwitchTheme` tắt), được `lockConfig` để yên ở `off`.
- Chữ đang dựng dấu lấy `--partial-letter-color`, mặc định là màu accent. Bảng
  nào có accent lẫn với chữ đã gõ hoặc chữ chưa gõ thì đặt `partialLetter`
  trong `constants/themes.ts` (midnight lấy màu hổ phách của keybear, như
  racing và pixel đặt trong file css của chúng).
- Bàn phím ảo: `src/ts/components/pages/test/Keymap.tsx` và `keymapLayouts.ts`
  (chỉ QWERTY, hàng chữ và phím cách, chế độ `react`), trạng thái trong
  `src/ts/states/test.ts`. Phím sáng theo ký tự hệ thống nhận (`event.key`), chữ
  có dấu sáng phím Telex cuối của nó (`ơ` sáng `w`), không theo `event.code`:
  người gõ dùng Colemak, và VTX gửi mọi phím với mã 0, trình duyệt đọc thành
  `KeyA`. `static/layouts/qwerty.json` chỉ tải khi bật.
- Phím gõ sai dưới chữ (`indicateTypos: "below"`): `test-ui.ts` treo các
  `hint` lấy từ `typoHints` trong `beartype/word-html.ts`; chữ đang dựng dấu
  không bao giờ có hint.
- `src/ts/test/`, `src/ts/input/`, `src/ts/elements/`: lõi gõ của monkeytype.
- `src/ts/schemas/`: schema zod của cấu hình và kết quả (trước là package
  `@monkeytype/schemas`).
- Phông: giao diện là Quicksand; bài gõ dùng một phông theo ngôn ngữ, Be Vietnam
  Pro cho tiếng Việt và Roboto Mono cho tiếng Anh (`applyTypingFont` trong
  `ui.ts`, `@font-face` trong `beartype.scss`, preload trong
  `src/html/head.html`). File ở `static/fonts-ui/` (mỗi phông một bộ `latin` và
  một bộ `vietnamese`) và `static/webfonts/` (phần latin của Roboto Mono).
- Icon: một sprite SVG ở `src/html/icons.html` (Lucide, và dấu GitHub của
  Simple Icons), dùng qua `<svg class="bt-icon"><use href="#i-TÊN"></use></svg>`
  hoặc component `Icon`. Icon mới thì chép path của Lucide vào sprite và thêm
  tên vào `IconName`; không cài package icon.
- `src/styles/beartype.scss`: mọi style riêng của beartype.
- `scripts/build-vietnamese.ts`: dựng `static/languages/vietnamese.json` từ danh
  sách từ của keybear.

Test của beartype nằm ở `__tests__/beartype/`.

## Quy ước của code monkeytype, giữ khi sửa code của họ

- Nửa SolidJS (`.tsx`, code mới) nửa vanilla (`test/`, `input/`, `elements/`,
  code cũ).
- Chạy một file test: `pnpm vitest run path/to/test.ts`.
- Kiểm kiểu: `pnpm oxlint --type-aware --type-check --format agent`.
- Style: Tailwind, thuộc tính `class` và `cn`, chỉ dùng màu trong config
  Tailwind.

## Quy ước của beartype

- Code beartype tự viết nằm trong `src/ts/beartype/` và `components/beartype/`.
- Tính năng nào không còn thì xoá hẳn, không ghim cấu hình để giấu. Khoá cấu
  hình nào người dùng không đổi được thì không nằm trong `Config`.
- `localStorage` của người dùng cũ (cấu hình, kết quả, sổ từ) phải nạp được
  sau mọi thay đổi: schema zod không `.strict()`, và có test cho dữ liệu cũ
  (`__tests__/beartype/production-local-storage.spec.ts`).
- Style đè lên upstream trong `beartype.scss`: file này nạp sau cùng nhưng
  cùng layer, nên chỉ thắng khi selector cao bằng hoặc hơn. Upstream viết
  `button:hover`, `button.text` (cần `button.bt-…`), `#result .wrapper
  button` (cần selector có `#result`) và media query
  `.pageTest #result .wrapper …` (cần tiền tố `.pageTest`). Nhớ thử ở khung
  hẹp, vì media query chỉ lộ ra ở đó.
- Ba nút `bt-action` (bài mới, gõ lại, luyện từ hay sai) và ba viên ở chân
  trang không mang chữ: mỗi cái là một hình tròn 44px, chữ nằm trong bong
  bóng `aria-label` + `data-balloon-pos`. Mô tả trong thẻ cài đặt cũng vậy:
  một nút `i` nhỏ cạnh tên hàng (`bt-settings-info`), không còn dòng chữ mờ
  bên dưới. Thêm hàng cài đặt mới thì `hint` là tuỳ chọn, hàng nào tên đã đủ
  rõ thì bỏ hẳn.
- Icon của các nút `bt-action` (bài mới, gõ lại, luyện từ hay sai) là icon
  Material Design keybear dùng, viết thẳng thành `<svg class="bt-action-icon">`
  với path chép từ `@mdi/js` của keybear, không qua sprite. Trong `.tsx` thì
  `<path>` phải có thẻ đóng, vì oxlint chặn thẻ tự đóng. Preflight của Tailwind
  đặt mọi `svg` là `display: block`, nên icon nằm trong một nút `block`
  (upstream làm thế với nút "bài mới" trên màn cảm ứng) sẽ đứng đè lên chữ, trừ
  khi được đặt lại thành `inline-block` (`.bt-icon` đã làm sẵn).
- Thanh tuỳ chọn không bao giờ xuống dòng; màn hẹp thì nó cuộn ngang.
- Thẻ cài đặt chỉ là hộp cuộn khi cửa sổ thấp dưới 32rem. Hộp cuộn cắt mọi
  thứ thò ra khỏi nó, trên cả hai chiều, mà bong bóng của các nút `i` thì thò
  ra: đừng trả `overflow-y: auto` về cho `.bt-settings-card` ở mọi cỡ màn.
- Màn kết quả: Enter một mình mở bài mới (`test-logic.ts`), trừ khi tiêu điểm
  đang ở một nút hay một liên kết — nó tự trả lời Enter, và tab + enter đi
  đường đó.
- Không có thông báo nổi, cũng không có store cho chúng. Cần báo gì cho người
  gõ thì viết thẳng lên màn, như lý do không lưu ở màn kết quả; lỗi chỉ dành
  cho người sửa code thì `console.error`.
- Sửa hay xoá code theo từng cụm, mỗi cụm một commit. Nếu cảm giác gõ lệch,
  `git bisect` sẽ chỉ ra cụm nào gây ra.
- Conventional commits, không ghi tên AI.
- GPL-3.0: giữ `LICENSE`, repo public, chân trang có nút GitHub trỏ về mã
  nguồn (bong bóng của nó chỉ ghi "mã nguồn"; giấy phép và gốc monkeytype nằm
  trong repo).
