# beartype

Đo tốc độ gõ tiếng Việt và tiếng Anh. Là bản fork sạch của monkeytype, xem
[docs/upstream.md](docs/upstream.md), đã bỏ gần hết tính năng. Chỉ còn một màn:
bài đo, phân tích cuối bài và luyện từ hay sai. Giao diện theo keybear
(`~/Documents/GitHub/keybear`), độ chính xác chấm theo keybear. Kế hoạch:
[plans/260911-1141-fork-monkeytype/plan.md](plans/260911-1141-fork-monkeytype/plan.md).

**Lý do repo này tồn tại:** keybear dựng lại màn đo tốc độ theo monkeytype
nhiều lần mà cảm giác gõ vẫn khác, và không ai chỉ ra được khác ở đâu. Nên
beartype **không sửa** những file tạo ra cảm giác ấy. Danh sách file và các chỗ
nối đã sửa nằm trong `docs/upstream.md`. Muốn sửa một file trong danh sách thì
chỉ sửa trong một khối `// beartype:` và ghi vào bảng ở đó.

## Chạy

Cần **Node 24**, vì `engineStrict` trong `pnpm-workspace.yaml` chặn Node 26
đang là mặc định của máy. Node 24 đã cài keg-only qua Homebrew, chỉ cần thêm vào
PATH cho từng lệnh:

```bash
export PATH=/opt/homebrew/opt/node@24/bin:$PATH
pnpm install
pnpm build-pkg          # các package @monkeytype/* phải build trước khi test hay dev
pnpm test-fe
cd frontend && pnpm dev # http://localhost:3200
```

**Cổng dev là 3200, và `strictPort` bật.** Upstream dùng 3000, nhưng trên máy
này cổng 3000 còn service worker của app khác trả lời từ cache. Keybear giữ 3100.

**Một push lên `main` là một lần deploy.** Cloudflare Pages build thẳng từ
nhánh này (`pnpm build-fe`, output `frontend/dist`, `NODE_VERSION=24`,
`PNPM_VERSION=11.21.0`), không qua staging. `.husky/pre-push` chạy ts-check,
test và build rồi mới cho push; đừng lách bằng `--no-verify`.

## Code của beartype nằm ở đâu

- `frontend/src/ts/beartype/`: chấm điểm theo phím (`scoring.ts`, chép từ
  keybear), kiểu bỏ dấu (`vietnamese.ts`, `tone-style.ts`), vẽ từ đang gõ
  (`word-html.ts`), khoá cấu hình (`config-lock.ts`), kết quả lưu trên máy
  (`local-results.ts`), sổ từ hay sai (`miss-book.ts`).
- `frontend/src/ts/components/beartype/`: thẻ cài đặt (con trỏ mượt, phông
  chữ), viên chọn màu ở chân trang (`ThemeMenu`, rê chuột là xem thử), nút
  luyện từ hay sai, sổ bài gần đây dưới màn kết quả (`ResultHistory`).
- `frontend/static/fonts-ui/`: Quicksand của giao diện và các phông bài gõ
  của keybear, mỗi phông có bộ `vietnamese` riêng.
- `frontend/src/styles/beartype.scss`: mọi style riêng của beartype.
- `frontend/scripts/build-vietnamese.ts`: dựng `static/languages/vietnamese.json`
  từ danh sách từ của keybear.

Test của beartype nằm ở `frontend/__tests__/beartype/`.

## Quy ước của code monkeytype, giữ khi sửa code của họ

- Frontend nửa SolidJS (`.tsx`, code mới) nửa vanilla (`test/`, `input/`,
  `elements/`, code cũ).
- Chạy một file test: `pnpm vitest run path/to/test.ts`.
- Kiểm kiểu: `pnpm oxlint --type-aware --type-check --format agent`.
- Style: Tailwind, thuộc tính `class` và `cn`, chỉ dùng màu trong config
  Tailwind. Code cũ dùng thẻ `i` FontAwesome, code mới dùng component `Fa`.

## Quy ước của beartype

- Code beartype tự viết nằm trong `frontend/src/ts/beartype/` và
  `components/beartype/`.
- Style đè lên upstream trong `beartype.scss`: file này nạp sau cùng nhưng
  cùng layer, nên chỉ thắng khi selector cao bằng hoặc hơn. Upstream viết
  `button:hover`, `button.text` (cần `button.bt-…`) và media query
  `.pageTest #result .wrapper …` (cần tiền tố `.pageTest`). Nhớ thử ở khung
  hẹp, vì media query chỉ lộ ra ở đó.
- Xoá code theo từng cụm, mỗi cụm một commit. Nếu cảm giác gõ lệch, `git bisect`
  sẽ chỉ ra cụm nào gây ra.
- Conventional commits, không ghi tên AI.
- GPL-3.0: giữ `LICENSE`, repo public, chân trang có nút GitHub trỏ về mã
  nguồn (bong bóng của nó ghi "fork của monkeytype · GPL-3.0").
