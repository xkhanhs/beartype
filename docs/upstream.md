# Upstream

beartype là bản chép sạch của [monkeytypegame/monkeytype](https://github.com/monkeytypegame/monkeytype)
(GPL-3.0), không mang lịch sử git.

| | |
|---|---|
| SHA | `91bd24bb8513785c7364cbea29296ff7adafac41` |
| Ngày commit | 2026-08-15 |
| Nhập vào beartype | 2026-09-11, commit `1b88575` |
| Test frontend lúc nhập | 54 file, 1.076 test, xanh (Node 24.20, pnpm 11.21) |

## So một file với upstream

Bản clone monkeytype nằm cạnh repo này ở `~/Documents/GitHub/monkeytype`:

```bash
git -C ../monkeytype show 91bd24bb:frontend/src/ts/test/test-ui.ts | diff - frontend/src/ts/test/test-ui.ts
```

## Những file không được sửa

Đây là chỗ cảm giác gõ của monkeytype nằm. Chỉ được sửa ở những khối đánh dấu
`// beartype:`, và mỗi khối phải ghi vào bảng dưới.

- `frontend/src/ts/input/**`
- `frontend/src/ts/test/test-ui.ts`, `caret.ts`, `test-timer.ts`, `test-logic.ts`,
  `words-generator.ts`, `pace-caret.ts`, `test/events/**`
- `frontend/src/ts/legacy-states/composition.ts`
- `frontend/src/ts/utils/debounced-animation-frame.ts`
- `frontend/src/styles/caret.scss`, `frontend/src/styles/test.scss`

## Các chỗ đã sửa trong lõi

| File | Khối | Vì sao |
|------|------|--------|
| _(chưa có)_ | | |
