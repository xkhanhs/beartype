---
phase: 2
title: "Màn kết quả: biểu đồ, replay, lịch sử gõ"
status: completed
priority: P1
effort: "2h"
dependencies: [1]
---

# Phase 2: Màn kết quả, phần đã ẩn

## Overview
Plan keybear-look đã ẩn biểu đồ theo giây, lịch sử gõ và replay trong khối
`.bt-unused`, vì hồi đó không được sửa `test-ui.ts`. Giờ đã được sửa, nên gỡ hẳn
cả code lẫn phần tử DOM.

## Requirements
- Gỡ `controllers/chart-controller.ts`, mọi lời gọi `ChartController` trong
  `test/result.ts`, và các gói `chart.js`, `chartjs-adapter-date-fns`,
  `chartjs-plugin-annotation`, `chartjs-plugin-trendline`,
  `@types/chartjs-plugin-trendline`. Bỏ chunk `vendor-chart` trong `vite.config.ts`.
- Gỡ `test/replay-ui.ts` và lời gọi `pauseReplay()` trong `test-logic.ts`.
- Gỡ `#resultWordsHistory` và phần vẽ lịch sử gõ trong `test-ui.ts` (hàm nào chỉ
  phục vụ nó), `elements/result-word-highlight.ts` nếu chỉ phục vụ lịch sử gõ.
- Gỡ khối `.bt-unused` trong `test-result.html` và rule `.bt-unused` trong `beartype.scss`.
- `date-fns`: bỏ nếu sau khi gỡ chart không còn ai cần (kiểm `date-and-time.ts`,
  `InputField.tsx`; hai file này có thể cũng bị xoá ở phase 4).
- `toggleSmoothedBurst`, `toggleUserFakeChartData` và các biến burst/chart chỉ
  dành cho biểu đồ: bỏ, kể cả `addToGlobal` trong `index.ts`.
- Giữ: vương miện kỷ lục, pháo giấy (`canvas-confetti`), sổ bài gần đây, biểu đồ
  cột của `ResultHistory` (vẽ bằng CSS, không dùng chart.js).

## Related Code Files
- Delete: `frontend/src/ts/controllers/chart-controller.ts`, `frontend/src/ts/test/replay-ui.ts`,
  có thể `frontend/src/ts/elements/result-word-highlight.ts`
- Modify: `frontend/src/ts/test/result.ts`, `test-logic.ts`, `test-ui.ts`, `frontend/src/ts/index.ts`,
  `frontend/src/html/pages/test-result.html`, `frontend/src/styles/beartype.scss`,
  `frontend/vite.config.ts`, `frontend/package.json`

## Steps
1. Gỡ chart (một commit), replay (một commit), lịch sử gõ (một commit).
2. Sau mỗi commit: test, `tsc`, build, rồi làm một bài và xem màn kết quả, console sạch.

## Success Criteria
- [ ] Build không còn `vendor-chart`; JS giảm khoảng 265 KB.
- [ ] Màn kết quả y như trước; phá kỷ lục vẫn có vương miện và pháo giấy.

## Risk Assessment
- `test-ui.ts` gọi `qsr("#resultWordsHistory")` lúc nạp module; gỡ phần tử mà sót
  lời gọi thì app dừng lúc khởi động. Build không bắt được, phải mở trang thật.
