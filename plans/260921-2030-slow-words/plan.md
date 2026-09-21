---
title: "Từ chậm: đo tốc độ từng từ, luyện riêng những từ gõ đúng mà chậm"
status: done, chờ người dùng gõ thử trước khi merge
branch: feature/slow-words
created: 2026-09-21
blockedBy: []
blocks: []
---

# Từ chậm

Sổ từ hay sai (`beartype/miss-book.ts`) bắt những từ **gõ sai**. Plan này thêm
một sổ thứ hai cho những từ **gõ đúng nhưng chậm** hơn tay mình thường gõ. Mỗi
bài thường đều đo tốc độ từng từ. Từ nào chậm hẳn so với mốc của chính người
gõ thì vào sổ, và có một nút riêng để luyện dồn những từ đó.

Nguồn ý tưởng: cách chấm từng từ ở màn Colemak của keybear
(`packages/page-practice/lib/colemak/word-speed.ts`,
`worddrill/word-timings.ts`). **Không** chép FSRS: bộ 663 từ đủ nhỏ để rút
ngẫu nhiên đã gặp mỗi từ nhiều lần, nên một lịch ôn không thêm được gì.

## Kết quả mong muốn

- Sau mỗi bài hợp lệ, mỗi từ gõ sạch có một mẫu tốc độ, đếm theo phím Telex
  (`wordCost`, có tính dấu cách).
- Màn kết quả có một thanh ngang theo kiểu dải nhớ của keybear: theo kịp /
  chậm / chưa đo. Bong bóng của đoạn chậm nêu năm từ chậm nhất.
- Nút `bt-action` thứ tư mở bài chỉ gồm những từ chậm, cùng cách chạy với bài
  luyện từ hay sai.
- Một từ tự rời sổ khi những bài thường sau đó cho thấy nó đã theo kịp mốc.

## Đã chốt với người dùng

| Câu hỏi | Chốt |
|---|---|
| FSRS | **Không làm.** Chỉ lấy cách chấm tốc độ theo trung vị của chính mình. |
| Từ sai và từ chậm | **Hai sổ riêng.** Từ gõ sai, kể cả sai rồi sửa, không bao giờ vào phép đo tốc độ. |
| Nút luyện | **Nút riêng, thứ tư**, đứng cạnh nút luyện từ hay sai. |
| Màn kết quả | Ban đầu là một dòng chữ; sau khi xem, người dùng đổi sang **thanh ngang như dải nhớ của keybear**, bỏ dòng chữ. |
| Bộ từ đo | Chỉ `vietnamese.json` (663 từ) và `english.json` (200 từ). Không chép danh sách 3000 từ của keybear. |
| Bộ ẩn `#khanh` | **Xoá hẳn** (commit riêng). Cấu hình còn lưu `vietnamese_khanh` nạp lại thành `vietnamese`. |

## Tự quyết (ghi lại để soát)

- **Mốc chia theo độ dài từ.** Thời gian đổi từ (đọc từ tiếp theo, nhấc tay)
  gần như cố định cho mỗi từ, nên tính theo phím thì từ ngắn luôn "chậm" hơn từ
  dài. So với một mốc chung, sổ sẽ đầy những từ như `à`, `có`, `the`. Vì vậy mỗi
  từ được so với trung vị của những từ **cùng số phím**. Nhóm nào dưới 20 mẫu
  thì gộp với nhóm liền kề.
- **Chậm = trung vị các lần gõ của từ đó < 0.85 × mốc**, và từ đó phải có ít
  nhất 3 mẫu. Một lần khựng không làm oan cho cả từ. Con số 0.85 là điểm xuất
  phát. Sau khoảng 20 bài, đọc lại sổ trên dữ liệu thật rồi mới chỉnh.
- **Rời sổ không cần luật riêng.** Mỗi từ giữ 5 mẫu gần nhất. Gõ nhanh lên thì
  mẫu mới đẩy trung vị lên qua mốc và từ tự ra khỏi sổ. Khác với sổ từ hay sai,
  sổ này không cần "nợ" hay "trả".
- **Mốc lấy 500 mẫu gõ sạch gần nhất** (mỗi mẫu gồm số phím và tốc độ), mỗi
  ngôn ngữ một dãy. Mốc đi theo tay của hôm nay. Chưa đủ 100 mẫu thì chưa có
  mốc và sổ trống.
- **Không đo:** bài luyện (mode `custom`), vì lặp dày làm tốc độ phồng lên; bài
  không được lưu (`dontSave`); từ đầu bài, vì nó không có quãng đổi từ phía
  trước; từ cuối bị đồng hồ cắt; từ bị gõ lại sau khi đã chốt; input do
  monkeytype tự sinh (`automatic`).
- Bài luyện từ chậm không làm thay đổi sổ. Nó chạy cho đến khi người gõ tắt,
  giống màn Colemak khi luyện từ khó: có thuộc hay chưa là việc của những bài
  thường sau đó trả lời.

## Phase

| # | Phase | Commit | Rủi ro |
|---|---|---|---|
| 1 | [Đo tốc độ từng từ và sổ từ chậm](phase-01-slow-book.md) | 1 | trung bình: đọc event log cho đúng |
| 2 | [Ghi sổ sau mỗi bài](phase-02-record.md) | 1 | thấp: chỉ đọc log sau bài, không đụng đường xử lý phím |
| 3 | [Nút luyện từ chậm](phase-03-drill-button.md) | 1–2 | trung bình: `practise-words` đang giả định chỉ có một loại bài luyện |
| 4 | [Dòng từ chậm ở màn kết quả, docs](phase-04-result-line-docs.md) | 1–2 | thấp |

Mỗi phase là một commit xanh qua pre-push (ts-check, knip, test, build). Phase 1
chỉ export những gì phase 2 dùng ngay, để knip không kêu giữa chừng. Nếu cần
thì gộp commit của phase 1 và 2 làm một.

## Tiêu chí hoàn thành

- Test thuần cho phần đo thời gian, mốc, chọn từ chậm và dữ liệu cũ trong
  `localStorage` đều xanh. `pnpm test` xanh, oxlint type-aware sạch, knip sạch.
- Seed `localStorage` với một sổ có từ chậm (bài gõ chạy trong khung ẩn không
  cho ra kết quả hợp lệ), rồi kiểm trong trình duyệt: dòng ở màn kết quả, nút
  thứ tư, bong bóng của nút, và bật/tắt bài luyện. Kiểm cả ở khung hẹp.
- Cảm giác gõ không đổi: không file nào trong `input/` bị sửa.

## Câu hỏi còn mở

- Không có.
