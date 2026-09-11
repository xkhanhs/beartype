# beartype

Đo tốc độ gõ tiếng Việt và tiếng Anh. Khởi đầu là bản fork của monkeytype (xem
[docs/upstream.md](docs/upstream.md)), giờ chỉ còn một màn: bài đo, phân tích
cuối bài và luyện từ hay sai. Giao diện theo keybear
(`~/Documents/GitHub/keybear`), độ chính xác chấm theo keybear. Kế hoạch gần
nhất: [plans/260911-1601-slim-codebase/plan.md](plans/260911-1601-slim-codebase/plan.md).

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
  phông chữ, cỡ chữ, tiếng gõ, tiếng báo gõ sai, âm lượng, hiện phím gõ sai, bàn
  phím ảo), viên chọn màu ở chân trang (`ThemeMenu`, rê chuột là xem thử), nút
  luyện từ hay sai, sổ bài gần đây dưới màn kết quả (`ResultHistory`).
- Âm thanh: `src/ts/controllers/sound-controller.ts` và
  `src/ts/constants/sounds.ts`, file ở `static/sounds/` (năm bộ của upstream
  và `error1`, giữ tên thư mục của upstream). Mặc định tắt; chưa bật thì không
  tải gì, bật thì chỉ tải howler và bộ đang chọn.
- Bàn phím ảo: `src/ts/components/pages/test/Keymap.tsx` và `keymapLayouts.ts`
  (chỉ QWERTY, hàng chữ và phím cách, chế độ `react`), trạng thái trong
  `src/ts/states/test.ts`. Phím sáng theo `event.code`, nên gõ Telex vẫn sáng
  đúng phím vật lý. `static/layouts/qwerty.json` chỉ tải khi bật.
- Phím gõ sai dưới chữ (`indicateTypos: "below"`): `test-ui.ts` treo các
  `hint` lấy từ `typoHints` trong `beartype/word-html.ts`; chữ đang dựng dấu
  không bao giờ có hint.
- `src/ts/test/`, `src/ts/input/`, `src/ts/elements/`: lõi gõ của monkeytype.
- `src/ts/schemas/`: schema zod của cấu hình và kết quả (trước là package
  `@monkeytype/schemas`).
- `static/fonts-ui/`: Quicksand của giao diện và các phông bài gõ của keybear,
  mỗi phông có bộ `vietnamese` riêng. `static/webfonts/`: phần latin của Roboto
  Mono và IBM Plex Mono.
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
  Tailwind. Code cũ dùng thẻ `i` FontAwesome, code mới dùng component `Fa`.
  Icon FontAwesome chỉ được đóng gói nếu tên `fa-…` của nó xuất hiện trong
  `src/` (plugin `vite-plugins/fontawesome-subset.ts` quét chuỗi); icon mới thì
  thêm vào `src/ts/types/font-awesome.d.ts`.

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
- Icon của các nút `bt-action` (bài mới, gõ lại, luyện từ hay sai) là icon
  Material Design keybear dùng, viết thẳng thành `<svg class="bt-action-icon">`
  với path chép từ `@mdi/js` của keybear, không dùng FontAwesome. Trong `.tsx`
  thì `<path>` phải có thẻ đóng, vì oxlint chặn thẻ tự đóng. Preflight của
  Tailwind đặt mọi `svg` là `display: block`, nên icon nằm trong một nút
  `block` (upstream làm thế với nút "bài mới" trên màn cảm ứng) sẽ đứng đè lên
  chữ, trừ khi được đặt lại thành `inline-block`.
- Thanh tuỳ chọn không bao giờ xuống dòng; màn hẹp thì nó cuộn ngang.
- Không có thông báo nổi: danh sách thông báo không được gắn vào trang
  (`components/layout/overlays/Overlays.tsx`). Cần báo gì cho người gõ thì
  viết thẳng lên màn, như lý do không lưu ở màn kết quả.
- Sửa hay xoá code theo từng cụm, mỗi cụm một commit. Nếu cảm giác gõ lệch,
  `git bisect` sẽ chỉ ra cụm nào gây ra.
- Conventional commits, không ghi tên AI.
- GPL-3.0: giữ `LICENSE`, repo public, chân trang có nút GitHub trỏ về mã
  nguồn (bong bóng của nó ghi "fork của monkeytype · GPL-3.0").
