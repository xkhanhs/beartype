# beartype

Đo tốc độ gõ tiếng Việt và tiếng Anh: **https://beartype.pages.dev**

beartype là bản rút gọn của [monkeytype](https://github.com/monkeytypegame/monkeytype).
Phần gõ (ô nhập, cách vẽ chữ, con trỏ, đồng hồ) giữ nguyên của monkeytype. Phần
còn lại bị bỏ gần hết: không tài khoản, không máy chủ, không bảng xếp hạng,
không quote, không funbox. Chỉ còn một màn:

- **Bài đo** theo thời gian (15/30/60/120 giây) hoặc theo số từ (10/25/50/100),
  bằng tiếng Việt hoặc tiếng Anh.
- **Kết quả gọn như keybear**: WPM, độ chính xác, số từ, thời gian, độ đều tay,
  rồi mức tốt nhất và tổng giờ luyện từ trước tới nay, mức trung bình, độ chính xác,
  độ đều tay và biểu đồ cột của 20 bài gần nhất cùng ngôn ngữ.
- **Giao diện của keybear**: ba mươi tám bảng màu — chín của keybear, hai mươi
  hai bảng tối và bảy bảng sáng của monkeytype — chọn trong danh sách ở chân
  trang (rê chuột để xem thử). Mặc định mỗi bài mới tự rút một bảng khác, sáng hay
  tối tuỳ cài đặt của máy; đổi nhóm hoặc tắt hẳn trong thẻ cài đặt. Phông bài
  gõ theo ngôn ngữ (Be Vietnam Pro cho tiếng Việt, Roboto Mono cho tiếng Anh),
  cỡ chữ theo các mức phóng của Chrome (80% tới 200%), và con trỏ mượt tuỳ
  chỉnh được.
- **Luyện từ hay sai**: một sổ lưu những từ gõ sai, và một nút mở bài chỉ gồm
  những từ đó.
- **Luyện từ chậm**: mỗi bài đo tốc độ từng từ gõ đúng, so với những từ cùng số
  phím mà chính bạn gõ gần đây. Từ nào chậm hẳn thì vào một sổ riêng, có nút
  luyện riêng, và màn kết quả vẽ cả bộ từ thành một thanh: theo kịp, chậm, chưa
  đo.
- **Hai bài tập đẩy tốc độ**: một **con trỏ dẫn tốc** chạy trước theo 80, 100
  hay 120% tốc độ thường của máy này — 80% để tập cho thật chuẩn, 120% để ép
  nhanh hơn — và chế độ **chuẩn tuyệt đối**, gõ sai một phím là bài dừng.
- **Tuỳ chọn trong thẻ cài đặt, mặc định tắt**: phím đã gõ nhầm hiện nhỏ dưới
  chữ, và bàn phím QWERTY dưới bài gõ, phím sáng lên khi gõ, kể cả khi gõ Telex.

## Chấm tiếng Việt theo phím

Monkeytype so từng ký tự ở cùng vị trí. Với tiếng Việt gõ qua bộ gõ, cách đó
tính `e` là sai khi đích là `ế`, dù bộ gõ dựng `ế` từ chính chữ `e` ấy. beartype
chấm theo cách của [keybear](https://keybear.pages.dev):

- **Một chữ đáng số phím nó tốn.** `a` là 1 phím, `ạ` là 2, `ế` là 3. WPM và độ
  chính xác đều tính theo đơn vị này.
- **Chữ đang dựng dấu là chưa xong, không phải sai.** Nó được gạch chân chấm cho
  tới khi đủ dấu.
- **Bỏ dấu thì chỉ mất đúng phím của dấu đó**, không mất cả chữ.
- **Độ chính xác tính trên từng phím lúc gõ**: gõ sai rồi xoá đi gõ lại vẫn là
  một lần sai, chỉ bài không sai phím nào mới được 100%. Bấm cách khi từ còn
  thiếu thì mỗi phím còn thiếu (chữ chưa gõ, dấu chưa bỏ) tính là một lần sai.
- **Dấu thanh vẽ theo kiểu bộ gõ của máy đang viết ra**, `hoà` hoặc `hòa`, và gõ
  kiểu nào cũng được chấm như nhau.

Tiếng Anh vẫn được chấm y hệt monkeytype, vì mỗi chữ cái Latin chỉ tốn một phím.

## Dữ liệu

Mọi thứ nằm trong `localStorage` của trình duyệt: cấu hình, kết quả, sổ từ hay
sai, sổ từ chậm. Không có gì được gửi đi. Xoá dữ liệu trang web là mất hết.

Thống kê tốc độ, kỷ lục, sổ từ hay sai và sổ từ chậm chỉ tách tiếng Việt với tiếng Anh. Bài
theo thời gian hay theo số từ, dài hay ngắn, đều gộp chung vào ngôn ngữ của nó.
Riêng kỷ lục chỉ tính bài chuẩn, 60 giây hoặc 50 từ trở lên: bài 10 từ chạy
nhanh hơn sức tay giữ được lâu, nên không đứng làm kỷ lục.
Bài không hợp lệ thì không được ghi vào đâu cả, kể cả bài có lúc ngừng gõ liền
5 giây hoặc tổng thời gian ngừng gõ quá 20% bài. Đồng hồ vẫn chạy khi ô gõ mất
focus hay khi chuyển tab, nên bỏ đi giữa bài cũng tính là ngừng gõ.

## Phát triển

Xem [CLAUDE.md](CLAUDE.md) để biết cách chạy, và [docs/upstream.md](docs/upstream.md)
để biết bản monkeytype gốc cùng những chỗ lõi gõ của beartype cố ý làm khác.

## Giấy phép

GPL-3.0, như monkeytype. Mã nguồn gốc là của Miodec và
[những người đóng góp cho monkeytype](https://github.com/monkeytypegame/monkeytype/graphs/contributors).
Icon lấy từ [Lucide](https://lucide.dev) (ISC, một phần từ Feather, MIT) và dấu
GitHub của [Simple Icons](https://simpleicons.org) (CC0); giấy phép ghi ở đầu
[src/html/icons.html](src/html/icons.html).
