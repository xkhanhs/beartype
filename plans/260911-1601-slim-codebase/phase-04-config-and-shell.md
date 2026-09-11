---
phase: 4
title: "Config, theme, util, component"
status: pending
priority: P2
effort: "5h"
dependencies: [3]
---

# Phase 4: Config, theme, util, component

## Overview
Sau phase 3, `Config` chỉ còn các khoá beartype dùng. Phần "vỏ" quanh lõi vẫn
được dựng cho monkeytype đầy đủ: metadata của ~100 cài đặt, 2.447 dòng theme,
router nhiều trang, hệ modal 40 loại, bộ component animation/form. Phase này
thu chúng về đúng cỡ.

## Requirements
- **Config**: `config/metadata.tsx` (1.356 dòng) chỉ còn metadata của khoá còn
  lại, hoặc bỏ hẳn nếu `setters.ts`/`validation.ts` làm được việc bằng schema
  zod. `config-lock.ts` thành: mặc định + danh sách giá trị cho phép. `schemas/configs`
  chỉ còn khoá còn dùng. Test mới: `localStorage` có khoá cũ (vd `funbox`,
  `paceCaret`) thì bị bỏ qua và app vẫn nạp đúng khoá còn lại.
- **Theme**: `constants/themes.ts` chỉ còn chín `keybear_*`; `theme-controller.ts`
  bỏ custom theme, random theme, preset.
- **Phông, ngôn ngữ**: `constants/fonts.ts` còn sáu phông; `constants/languages.ts` và
  `schemas/languages` còn `vietnamese`, `english`.
- **Util chết** (đồ thị gọi hàm liệt kê ~60 hàm export không ai gọi): các hàm trong
  `utils/misc.ts`, `strings.ts`, `numbers.ts`, `arrays.ts`, `date-and-time.ts`,
  `colors.ts`, `json-data.ts` (GitHub releases, contributors…); file
  `utils/ip-addresses.ts`, `ddr.ts`, `file-storage.ts` (+ `idb`), `profiler-mode.ts`,
  `skeleton.ts` nếu không ai import. Dùng knip xác nhận từng cái.
- **Component**: `components/common/anime/{AnimeGroup,AnimeMatch,AnimeSwitch}.tsx`,
  `components/ui/form/*` + `@tanstack/solid-form` nếu `SimpleModal` không còn cần
  form, `states/modals.ts` còn đúng các modal đang dùng, `states/banners.ts`,
  `states/loader-bar.ts`, `Header` nếu chỉ còn logo.
- **Router**: một trang thì `route-controller.ts`, `page-controller.ts`, `pages/page.ts`
  (+ `zod-urlsearchparams`), `pages/loading.ts` rút về lời gọi mở trang test trực tiếp.
  Giữ `_redirects` về `/`.
- **HTML**: `popups.html` (dialog commandline còn sót), `warnings.html` (nocss…) chỉ
  giữ phần còn dùng.
- **`index.ts`**: bỏ các `addToGlobal` debug của upstream (`glarsesMode`, `enableTimerDebug`…)
  trừ `lastEventLog`/`currentEventLog` nếu còn giúp debug cảm giác gõ.

## Related Code Files
- Modify/Delete: `frontend/src/ts/config/**`, `constants/**`, `controllers/**`,
  `utils/**`, `components/common/**`, `components/ui/**`, `components/modals/**`,
  `states/**`, `pages/**`, `frontend/src/html/**`, `packages/schemas/src/**`
- Test: `frontend/__tests__/beartype/config-lock.spec.ts`, `__tests__/root/config*.spec.ts`

## Steps
1. Mỗi gạch đầu dòng ở Requirements là một commit; test, `tsc`, build sau mỗi commit.
2. Chạy knip sau cùng; mọi mục knip báo là việc của phase này.

## Success Criteria
- [ ] knip không báo file, export hay dependency thừa.
- [ ] Đổi theme, phông, ngôn ngữ, chế độ, con trỏ mượt; tải lại trang, vẫn giữ lựa chọn.
- [ ] `localStorage` từ bản production hiện tại nạp được, không lỗi console.

## Risk Assessment
- Bỏ router có thể làm hỏng khởi động (`configLoadPromise.then(startRouter)`). Kiểm
  trang trắng, `/` và `/abc` (redirect) trên bản build (`vite preview`), không chỉ dev.
