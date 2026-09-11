---
title: "Dọn tiếp: bỏ âm thanh, chốt phông, icon SVG, xoá phần upstream còn sót"
status: done, chờ người dùng gõ thử trước khi merge
branch: worktree-chore+slim-further
created: 2026-09-11
blockedBy: []
blocks: []
---

# Dọn tiếp beartype

Sau [lượt dọn trước](../260911-1601-slim-codebase/plan.md), beartype không còn
port gì từ monkeytype nữa. Những gì đang được giữ "cho khớp upstream" không còn
lý do để giữ. Lượt này bỏ âm thanh, chốt phông, thay FontAwesome bằng SVG, và
xoá phần upstream còn sót mà knip không bắt được (code chỉ còn test của chính
nó gọi, CSS cho phần tử không tồn tại, cấu hình build cho package đã bỏ).

Nguồn: bốn lượt review chỉ đọc (âm thanh + phông, icon, TS chết, CSS + tooling),
đã đối chiếu lại bằng grep và một lượt knip không tính test là entry. Chạy ở
commit `e9673a4`.

## Số liệu lúc bắt đầu (commit `e9673a4`)

| | |
|---|---|
| `src/` (ts, tsx, scss, css, html) | 20.420 dòng, 160 file TS |
| `__tests__/` | 9.724 dòng, 813 test, xanh |
| `static/` | 916 KB, trong đó `sounds/` 620 KB, phông 220 KB |
| JS `dist` | ~344 KB, trong đó `vendor-howler` 36 KB (chỉ tải khi bật âm thanh) |

## Đã chốt với người dùng

| Câu hỏi | Chốt |
|---|---|
| Âm thanh | **Bỏ hẳn**: file, cài đặt, khoá cấu hình, howler. |
| Phông bài gõ | **Cố định theo ngôn ngữ**: Roboto Mono cho bài tiếng Anh, Be Vietnam Pro cho bài tiếng Việt, phông hệ thống dự phòng. Bỏ bộ chọn phông; giữ bộ chọn cỡ chữ. |
| Phông giao diện | Giữ Quicksand. |
| Icon | **Chép SVG của Lucide** vào repo, không cài package. Bỏ FontAwesome. |
| Vương miện kỷ lục | Chỉ còn một trạng thái: kỷ lục mới. Bỏ `?`, bỏ vương miện gạch chéo, bỏ vương miện cảnh báo: bài không hợp lệ thì không có xếp hạng. |
| Hoạt ảnh (`components/common/anime/`) | **Giữ**: nháy phím trên bàn phím ảo và đồng hồ hiện dần phải mượt như cũ. |
| Pháo giấy | **Giữ.** |
| Tiếng Hàn (`hangul-js`) | **Bỏ.** |
| Giữ đường cập nhật từ upstream | **Không cần.** Code chết trong đường xử lý phím cũng xoá, mỗi cụm một commit. |

## Tự quyết (người dùng chưa hỏi, ghi lại để soát)

- Phông dự phòng theo đúng loại: `"Roboto Mono", ui-monospace, monospace` và
  `"Be Vietnam Pro", system-ui, sans-serif`, để mất phông thì bài tiếng Anh vẫn
  đơn cách.
- Giữ các hàm chấm điểm chỉ test gọi (`wordProgress`, `offTrack`,
  `stepsToward`, `markCount`…): chúng giữ cho khớp **keybear**, nguồn chấm điểm
  beartype đang theo, không phải upstream.
- Icon GitHub lấy từ simple-icons (CC0), vì Lucide đã bỏ icon thương hiệu.
- Hoãn: `minify-json`, `oxlint-checker`/`oxlint-overlay`, `tsx`. Chúng còn
  chạy đúng; bỏ hay không là chuyện sở thích, không phải code chết.

## Phase

| # | Phase | Commit dự kiến | Rủi ro |
|---|---|---|---|
| 1 | [Tooling và cấu hình build](phase-01-tooling.md) | 3–4 | thấp |
| 2 | [TS chết ngoài đường gõ](phase-02-dead-ts.md) | 5–6 | thấp |
| 3 | [Bỏ âm thanh](phase-03-sound.md) | 2 | cao ở `test-ui.ts` |
| 4 | [Code chết trong đường xử lý phím](phase-04-keystroke-dead-code.md) | 3 | cao |
| 5 | [Chốt phông theo ngôn ngữ](phase-05-fonts.md) | 1–2 | trung bình |
| 6 | [Icon SVG, vương miện một trạng thái](phase-06-icons.md) | 2 | trung bình |
| 7 | [CSS chết](phase-07-dead-css.md) | 2 | cao ở CSS vùng gõ |
| 8 | [Docs và kiểm tra cuối](phase-08-docs-verify.md) | 1 | thấp |

Thứ tự này để pre-push xanh sau từng commit. Phase 4 đi sau phase 3 vì cùng
đụng `test-ui.ts`/`test-logic.ts`, và trước phase 6 vì vương miện chỉ gọn được
khi nhánh bỏ ngang (`bailedOut`) đã đi.

## Số liệu sau khi xong

| | Trước (`e9673a4`) | Sau |
|---|---|---|
| `src/` | 20.420 dòng, 160 file TS | 16.231 dòng (−20%), 145 file TS |
| `__tests__/` | 9.724 dòng, 813 test | 7.370 dòng, 564 test |
| `static/` | 916 KB | 180 KB |
| `dist` | 1,4 MB; JS 344 KB; CSS 127 KB | 512 KB; JS 271 KB; CSS 50 KB |
| Dependency bỏ | | `howler`, `@types/howler`, `hangul-js`, `date-fns`, `@fortawesome/fontawesome-free`, `fontawesome-subset`, `jsdom`, `autoprefixer` |

Làm thêm ngoài danh sách ban đầu, vì cùng loại code chết: `break-joining.ts`
(no-op), hỗ trợ chữ viết phải sang trái và chữ nối, bộ đếm giờ `setTimeout` cũ,
hai bộ mặc định gộp làm một (`default-config.ts`), các lệnh ghi vào ô kết quả
không còn trong HTML, `types/validation.d.ts`. Lớp `joiningScript` được giữ cho
bài luyện (`updateDrillLayout`), vì nó đổi cách vẽ chữ khi luyện.

Để lại, chưa làm: hỗ trợ ký tự tab và xuống dòng trong bài (`wordsHaveTab`,
`wordsHaveNewline`, `.newline`…). Không danh sách từ nào có hai ký tự này,
nhưng phần này đan vào cách xử lý phím Enter và nhảy dòng, nên gỡ ra có rủi ro
lệch cảm giác gõ mà thu về ít.

Sửa môi trường test: vitest tìm jest-dom từ thư mục cha của gốc dự án, nên
worktree nằm trong `.claude/worktrees/` nạp nhầm bản của repo chính;
`vitest.config.ts` giờ chỉ thẳng đường dẫn.

## Tiêu chí xong

- `pnpm ts-check`, `pnpm knip`, `pnpm test`, `pnpm build` xanh sau từng commit
  (pre-push chạy cả bốn; không `--no-verify`).
- `production-local-storage.spec.ts` xanh: cấu hình cũ còn khoá âm thanh,
  `fontFamily`, `themeLight`… vẫn nạp được.
- Bài tiếng Việt và tiếng Anh gõ được, con trỏ không lệch khi vào bài lần đầu
  (phông Be Vietnam Pro đã preload).
- Không còn `fa-`, `fas`, `<Fa` trong `src/`; icon đứng đúng chỗ ở khung rộng
  và khung hẹp.
- Người dùng gõ thử và xác nhận cảm giác gõ không đổi trước khi merge.

## Ngoài phạm vi, đã ghi lại

- Tải danh sách từ thất bại (mất mạng, 404): reviewer nói `init()` thử lại mãi.
  Đọc lại thì không phải: `testReinitCount` dừng sau 3 lần và hiện
  `TestInitFailed`. Màn lỗi đó vẫn là chữ tiếng Anh của upstream.
- Thư mục `packages/` ở repo chính: rác cũ bị git bỏ qua (1,9 MB), đã xoá.
