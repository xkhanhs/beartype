---
title: "Dọn beartype về đúng những gì nó làm"
status: in-progress
branch: feat/sound-keymap
created: 2026-09-11
blockedBy: []
blocks: []
---

# Dọn beartype về đúng những gì nó làm

beartype chỉ còn một màn: đo tốc độ (time/words), phân tích cuối bài, luyện từ
hay sai. Nhưng repo vẫn chở gần nguyên monkeytype: 37.500 dòng TS ở frontend,
một monorepo turbo sáu package, 55 theme, 42 phông, 239 layout, `chart.js` cho
một biểu đồ đã ẩn. Code của những tính năng đã tắt vẫn nằm trong lõi, chỉ nhờ
`config-lock.ts` ghim cấu hình mà không chạy tới.

Lượt này bỏ phần thừa, gộp repo thành một package ở gốc, rồi thêm lại hai thứ
người dùng muốn giữ: âm thanh khi gõ và bàn phím ảo.

## Số liệu lúc bắt đầu (commit `79938a1`)

| | |
|---|---|
| TS trong `frontend/src/ts` | 217 file, 37.533 dòng |
| Package | `frontend` + `packages/{schemas,util,funbox,oxlint-config,tsup-config,typescript-config}` |
| Test | 50 file, 1.049 test, xanh |
| `vite build` | `dist` 9,0 MB; JS 960 KB (gzip ~306 KB), trong đó `vendor-chart` 265 KB |
| Asset tĩnh | webfonts 4,3 MB (42 phông), layouts 956 KB (239 file), themes 228 KB (55 file), images 560 KB |

## Đã chốt với người dùng

| Câu hỏi | Chốt |
|---|---|
| Có sửa file "cảm giác gõ" không | **Có.** Bỏ quy tắc cấm sửa của `docs/upstream.md`. Dọn theo cụm, mỗi cụm một commit để còn `git bisect`. |
| Tính năng bỏ | Chế độ quote/zen/custom, pace caret, funbox, lazy mode, giả lập layout, và mọi tuỳ chọn đang bị ghim tắt (xem phase 3). |
| Âm thanh | **Giữ và đưa vào cài đặt**, bộ rút gọn: khoảng 6 tiếng gõ, tiếng báo gõ sai bật/tắt, âm lượng. |
| Bàn phím ảo | **Thêm lại** keymap của upstream: chỉ QWERTY, phím sáng lên khi gõ (kiểu `react`), nằm dưới bài gõ, bật/tắt trong cài đặt. Chạy được cả tiếng Anh lẫn tiếng Việt vì nó chỉ nghe `keydown`. |
| Nhỏ lẻ còn hiện | Giữ: pháo giấy khi phá kỷ lục, cảnh báo Caps Lock, cảnh báo mất focus. Ô xem trước chữ đang dựng dấu (`compositionDisplay: "below"`) chưa từng hiện vì beartype ghim `"replace"`: xoá, giữ cách vẽ chữ dựng dấu ngay trong từ. |
| Phím gõ sai dưới chữ | **Thêm vào cài đặt, mặc định tắt** (người dùng đổi ý: bật khi cần) (`indicateTypos: "below"` của upstream, như monkeytype.com). Chỉ giữ `off`/`below`. Làm ở phase 6. |
| Cấu trúc repo | **Dời hết lên gốc**: một package, không `packages/`, không turbo. Phải đổi output dir trên Cloudflare Pages đúng lúc merge (phase 5). |
| Chặn phình | knip bản mới, chạy ở pre-push. Bỏ `.fallowrc.json`, eslint, prettier, madge. |
| File test | Giữ test của code còn lại (chấm điểm, bỏ dấu, xác thực phím, config, sổ từ sai) làm lưới an toàn khi dọn lõi; test của code bị xoá thì xoá theo. |

## Kết quả mong muốn

- Chỉ còn code chạy được với cấu hình beartype. Không còn nhánh `Config.funbox`,
  `mode === "quote"`, `paceCaret`… trong lõi.
- `Config` chỉ còn những khoá thật sự có ý nghĩa. Config-lock co lại thành bộ mặc
  định cộng danh sách giá trị cho phép.
- Repo một package ở gốc: `src/`, `static/`, `__tests__/`, `vite.config.ts`.
- Âm thanh và bàn phím ảo chạy, bật/tắt trong thẻ cài đặt.
- Cảm giác gõ không đổi: con trỏ, cuộn dòng, chấm theo phím, bỏ dấu dở không bị tính sai.

## Ràng buộc

- **Đường xử lý phím** (`input/handlers`, `input/listeners`, `input-element.ts`,
  `elements/caret.ts`, `utils/debounced-animation-frame.ts`, vòng lặp
  `test-timer.ts`) chỉ được bỏ nhánh chết. Không đổi thứ tự, không đổi thời điểm
  gọi, không "viết lại cho gọn".
- Mỗi cụm tính năng là một commit riêng; commit nào cũng xanh test, `tsc` và build.
- Người dùng cũ có `localStorage` chứa khoá đã bỏ: app phải bỏ qua chúng và chạy
  bình thường (test ở phase 4).
- Một lần push lên `main` là một lần deploy. Chia thành nhiều PR (xem dưới), không
  lách pre-push.

## Ngoài phạm vi

- Bộ gõ Telex tự dựng, layout khác QWERTY, chế độ `next` của keymap.
- Đổi cách chấm điểm, đổi giao diện ngoài hai thẻ cài đặt mới.
- Theme hay phông mới (thêm sau khi cần).

## Phase

| # | Phase | Phụ thuộc | PR | Trạng thái |
|---|-------|-----------|----|------------|
| 1 | [Asset và tooling thừa](phase-01-assets-and-tooling.md) | — | A | Xong ([#23](https://github.com/xkhanhs/beartype/pull/23)) |
| 2 | [Màn kết quả: biểu đồ, replay, lịch sử gõ](phase-02-result-leftovers.md) | 1 | A | Xong ([#23](https://github.com/xkhanhs/beartype/pull/23)) |
| 3 | [Gỡ tính năng khỏi lõi, từng cụm](phase-03-core-features.md) | 2 | B | Xong ([#23](https://github.com/xkhanhs/beartype/pull/23)) |
| 4 | [Config, theme, util, component](phase-04-config-and-shell.md) | 3 | C | Xong ([#23](https://github.com/xkhanhs/beartype/pull/23)) |
| 5 | [Một package ở gốc repo](phase-05-flatten-repo.md) | 4 | C | Xong ([#23](https://github.com/xkhanhs/beartype/pull/23)) |
| 6 | [Âm thanh và bàn phím ảo](phase-06-sound-and-keymap.md) | 5 | D | Đang làm |
| 7 | [knip, tài liệu, nghiệm thu](phase-07-guard-docs-verify.md) | 6 | D | Đang làm |

PR A và B chưa đổi cấu trúc thư mục, deploy như cũ. PR C dời repo lên gốc, nên
phải đổi cài đặt Cloudflare cùng lúc merge. PR D thêm tính năng.

## Tiêu chí nghiệm thu

- [ ] Không còn `packages/`, `turbo.json`, `frontend/`; `pnpm install && pnpm test && pnpm build` chạy ở gốc.
- [ ] `grep -rn "funbox\|paceCaret\|\"quote\"\|\"zen\"\|lazyMode\|layoutfluid" src/` không còn kết quả
      (trừ chú thích lịch sử nếu có, nhưng không nên có).
- [ ] Số dòng TS trong `src/ts` và kích thước JS của build giảm; ghi số trước/sau vào PR.
      Riêng `vendor-chart` phải biến mất.
- [ ] Test xanh; test của `beartype/` và `input/` giữ nguyên nội dung (không sửa để cho qua).
- [ ] knip sạch và chạy ở pre-push.
- [ ] Gõ thử bằng tay sau mỗi PR: tiếng Việt (Telex của máy) và tiếng Anh, time 15 và words 25:
      con trỏ mượt, dấu dở không đỏ, cuộn dòng, màn kết quả, luyện từ sai, sổ bài gần đây.
- [ ] Âm thanh và bàn phím ảo bật/tắt được, lưu qua lần tải lại.
- [ ] `CLAUDE.md`, `README.md`, `docs/upstream.md` khớp với repo mới.
