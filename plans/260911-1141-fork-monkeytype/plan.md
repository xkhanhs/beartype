---
title: "beartype — fork monkeytype, giữ lõi gõ, bỏ phần còn lại"
status: pending
created: 2026-09-11
upstream: monkeytypegame/monkeytype (ghim SHA ở phase 1)
---

# beartype

## Vì sao có repo này

Keybear đã nhiều lần dựng lại màn đo tốc độ theo monkeytype — mượn ô nhập không
kiểm soát, dấu cách giả, gom vẽ theo khung hình, con trỏ — mà cảm giác gõ vẫn
khác, và không ai mô tả được khác ở đâu. Tái tạo từng cơ chế một thì mỗi lần chỉ
chép được thứ mình đã nhận ra. Cách còn lại là **lấy nguyên code của họ rồi xoá**:
thứ tạo ra cảm giác ấy nằm đâu đó trong `frontend/src/ts/test/` và
`frontend/src/ts/input/`, và nếu hai thư mục đó không bị sửa thì nó đi theo.

## Kết quả mong muốn

Một trang web tĩnh ở `beartype.pages.dev`, một màn duy nhất:

1. **Đo tốc độ** — theo thời gian (15/30/60/120s) hoặc số từ (10/25/50/100),
   tiếng Việt hoặc tiếng Anh. Gõ y hệt monkeytype.
2. **Phân tích cuối bài** — màn kết quả của monkeytype, gọt bớt.
3. **Luyện từ hay sai** — sổ từ gõ sai lưu lâu dài trong trình duyệt, một nút
   mở bài chỉ gồm những từ đó.

Giao diện theo keybear (Quicksand, bảng màu keybear, nút viên thuốc). Không đăng
nhập, không máy chủ, dữ liệu nằm cố định trong `localStorage` của trình duyệt.

## Ràng buộc

- **Không sửa những gì tạo ra cảm giác gõ.** Ô nhập, các handler trong `input/`,
  `test-ui.ts` (vẽ chữ, cuộn dòng, gom khung hình), `caret.ts`, `test-timer.ts`
  giữ nguyên từng dòng — **trừ đúng một chỗ nối** bắt buộc cho cách chấm của
  keybear (phase 4), và chỗ ấy phải nhỏ, đánh dấu rõ.
- **Độ chính xác chấm theo keybear**: tính theo *phím đáng tốn* (`ế` = 3 phím),
  chữ đang dựng dở (`e` trên đường tới `ế`) là *chưa xong*, không phải *sai*.
  Đây là chỗ monkeytype sai với tiếng Việt: họ so từng ký tự, nên `e` đứng dưới
  `ế` bị tô đỏ và trừ điểm.
- Bản sạch, **một commit nhập** từ một SHA upstream đã ghim — không mang lịch sử
  git của họ. SHA ghi trong `docs/upstream.md` để sau này còn diff được.
- **GPL-3.0**: giữ `LICENSE`, repo GitHub phải public, ghi rõ "fork của
  monkeytype" ở README và chân trang.
- Deploy Cloudflare Pages, giống keybear: một push lên `main` là một lần deploy,
  nên pre-push chạy ts-check + test + build.

## Ngoài phạm vi

Tài khoản, đồng bộ, bảng xếp hạng, hồ sơ, quote, funbox, custom text, zen, chế
độ khó, stop-on-error, keymap, âm thanh, commandline, trang cài đặt của
monkeytype (thay bằng một ô cài đặt ba hàng: chủ đề, smooth caret, pace caret),
chủ đề của monkeytype, PWA, quảng cáo, Sentry, analytics, 440 ngôn ngữ còn lại.
Không liên kết gì với keybear (không PocketBase, không profile trẻ con).

## Các phase

| # | Phase | Phụ thuộc | Ước lượng |
|---|-------|-----------|-----------|
| 1 | [Nhập code và ghim upstream](phase-01-import-and-pin.md) | — | 2h |
| 2 | [Xoá backend, tài khoản và mọi thứ ngoài màn test](phase-02-strip-to-test-page.md) | 1 | 1–2d |
| 3 | [Khoá cấu hình, chỉ còn chế độ + ngôn ngữ](phase-03-freeze-config.md) | 2 | 1d |
| 4 | [Chấm điểm theo keybear](phase-04-keybear-scoring.md) | 3 | 1–2d |
| 5 | [Màn kết quả + sổ từ hay sai](phase-05-result-and-miss-book.md) | 4 | 1d |
| 6 | [Khoác giao diện keybear](phase-06-keybear-skin.md) | 3 | 1d |
| 7 | [Deploy Cloudflare Pages](phase-07-deploy.md) | 5, 6 | 2h |

Phase 6 chỉ đụng CSS/HTML nên chạy song song được với 4–5.

## Cổng kiểm tra xuyên suốt: "vẫn gõ y hệt"

Cảm giác gõ không đo được bằng một con số, nên mỗi phase xoá code đều qua hai
cổng:

1. **Tự động** — bộ test vitest của monkeytype cho `input/` và `test/`
   (`frontend/__tests__/input`, `__tests__/test`) phải xanh nguyên như lúc nhập.
   Test nào bị xoá phải xoá cùng code nó kiểm, không được xoá để cho xanh.
2. **Bằng tay người** — anh gõ cùng một bài tiếng Việt (VTX, Telex) và một bài
   tiếng Anh trên monkeytype.com và trên bản dev của beartype, cạnh nhau. Khác
   là dừng, `git bisect` qua các commit xoá của phase đó.

Cổng thứ hai là lý do phase 2 xoá **theo từng cụm, mỗi cụm một commit**: khi cảm
giác lệch, bisect chỉ ra ngay cụm nào mang nó đi.

## Tiêu chí hoàn thành

- [ ] `beartype.pages.dev` mở ra màn đo tốc độ, không có header điều hướng, không
      có modal cookie, không gọi mạng nào ngoài file tĩnh của chính nó.
- [ ] Gõ tiếng Việt bằng VTX: chữ dựng dở không đỏ, độ chính xác cuối bài khớp
      keybear trên cùng một chuỗi phím (test so sánh ở phase 4).
- [ ] Diff của `input/`, `test/test-ui.ts`, `test/caret.ts`, `test/test-timer.ts`
      so với SHA ghim chỉ gồm chỗ nối của phase 4.
- [ ] Sổ từ hay sai còn nguyên sau khi đóng trình duyệt mở lại.
- [ ] Anh gõ cạnh monkeytype.com và không phân biệt được.

## Quyết định đã chốt (2026-09-11)

1. **WPM và độ chính xác đều theo keybear** — tính theo phím đáng tốn. Monkeytype
   so từng ký tự nên đếm sai với tiếng Việt; beartype phân biệt từ *chưa xong*
   với từ *gõ sai*. Số WPM tiếng Việt vì thế không so thẳng với monkeytype.com.
2. **Từ tiếng Việt lấy `words-vi.json` của keybear** (đã sàng), đổi sang định dạng
   ngôn ngữ của monkeytype (`{ name, words: [...] }`) ở phase 2 cụm 5. Tiếng Anh
   giữ `english.json` của monkeytype.
3. **Chủ đề là của keybear, cơ chế áp màu là của monkeytype** — phase 6.
4. **Smooth caret mặc định `slow`, pace caret mặc định `average`** (cài đặt anh
   đang dùng), đổi được trong ô cài đặt — phase 3.
5. **Dấu thanh vẽ theo kiểu mới** (`hoà`, `uý`) — hay đúng hơn, theo kiểu bộ gõ
   của máy đang viết, mặc định kiểu mới. Monkeytype vẽ kiểu cũ (`hòa`). Chép cơ
   chế `toneStyleOf`/`withToneStyle` của keybear — phase 2 (danh sách từ) và
   phase 4 (vẽ + chấm).
6. Repo public `xkhanhs/beartype`.

## Câu hỏi còn mở

- Phần cấu hình monkeytype.com của anh chưa có trong ảnh (font, cỡ chữ, tape
  mode, …) — cần trước phase 3, xem danh sách ở đó.
