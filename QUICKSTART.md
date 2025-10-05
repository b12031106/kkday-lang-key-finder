# KKday Lang Key Finder 快速入門指南

## 🚀 快速安裝（5分鐘內開始使用）

### 1. 下載專案
```bash
git clone https://github.com/b12031106/kkday-lang-key-finder.git
cd kkday-lang-key-finder
```

### 2. 安裝依賴套件
```bash
npm install
```

### 3. 執行測試（可選）
```bash
npm test
```

### 4. 載入到 Chrome

1. 開啟 Chrome 瀏覽器
2. 在網址列輸入：`chrome://extensions/`
3. 開啟右上角的「開發人員模式」
4. 點選「載入未封裝項目」
5. 選擇專案資料夾 `kkday-lang-key-finder`
6. 確認擴充功能已啟用

## ✅ 驗證安裝

1. 在瀏覽器工具列看到 KKday Lang Key Finder 圖示（藍色搜尋圖示）
2. 訪問任何 `*.kkday.com` 網站
3. 點擊擴充功能圖示，應該會看到搜尋介面

## 🎯 基本使用

### 方法一：文字搜尋（Popup）
1. 點擊擴充功能圖示開啟 popup
2. 在搜尋框輸入要查找的文字（支援 Fuse.js 模糊搜尋）
3. 點擊結果項目的複製按鈕，將 key 複製到剪貼簿

### 方法二：右鍵選單搜尋（最快速！）
1. 在頁面上選取任何文字
2. 按右鍵，選擇「Search I18n Key for "..."」
3. 頁面會顯示搜尋結果通知
4. 找到的 key 會自動複製到剪貼簿
5. 不需要先開啟 popup，直接就能用！

### 方法三：元素選擇
1. 點擊擴充功能圖示開啟 popup
2. 點擊「選擇元素」按鈕
3. 滑鼠移到網頁上，元素會有藍色邊框高亮顯示
4. 點擊想要的元素
5. 自動找到對應的翻譯 key
6. 按 ESC 退出選擇模式

## 📊 功能驗證清單

- [ ] **安裝驗證**
  - 擴充功能成功載入
  - 圖示顯示在工具列
  - 只在 *.kkday.com 網域啟用

- [ ] **搜尋功能**
  - 輸入中文可以搜尋到結果
  - 輸入英文可以搜尋到結果
  - 模糊搜尋有效（Fuse.js 智能比對）
  - 搜尋結果按相關性排序

- [ ] **右鍵選單搜尋**
  - 選取文字後右鍵選單出現
  - 點擊選單項目觸發搜尋
  - 頁面顯示搜尋結果通知
  - Key 自動複製到剪貼簿

- [ ] **元素選擇**
  - 點擊「選擇元素」按鈕啟動
  - 滑鼠懸停有視覺回饋
  - 點擊元素找到對應 key
  - ESC 鍵退出選擇模式

- [ ] **剪貼簿功能**
  - 點擊複製按鈕
  - 看到「已複製」提示
  - 貼上驗證內容正確

- [ ] **效能測試**
  - 搜尋響應速度 < 100ms
  - 介面操作流暢
  - 無明顯卡頓

## 🔧 疑難排解

### 問題：擴充功能未啟用
- 確認網址是 `*.kkday.com`
- 檢查擴充功能是否已開啟
- 重新載入頁面

### 問題：找不到翻譯資料
- 確認頁面已完全載入
- 檢查開發者工具的 Console 是否有錯誤
- 確認頁面有 `__NUXT__` 或 `__INIT_STATE__` 全域變數

### 問題：搜尋無結果
- 嘗試搜尋更短的關鍵字
- 使用部分文字而非完整句子
- 檢查輸入是否有錯字

## 📈 效能指標

| 指標 | 目標值 | 實測值 |
|------|--------|--------|
| 搜尋響應時間 | < 100ms | ✅ ~2ms |
| 記憶體使用量 | < 5MB | ✅ ~0.5MB |
| 初始化時間 | < 1s | ✅ ~0.3ms |
| 支援資料量 | 10000+ | ✅ 測試通過 |

## 🧪 測試指令

```bash
# 執行所有測試
npm test

# 執行單元測試
npm test -- tests/unit/

# 執行效能測試
npm test -- tests/performance/

# 執行記憶體測試
npm test -- tests/memory/

# 執行 linting
npm run lint

# 執行完整建置流程
npm run build
```

## 📝 專案結構

```
lang-key-finder/
├── src/
│   ├── background/     # Service Worker（含右鍵選單）
│   ├── content/        # Content Script
│   ├── popup/          # Popup UI
│   ├── lib/            # 第三方函式庫（Fuse.js）
│   ├── models/         # 資料模型
│   └── services/       # 核心服務
├── tests/
│   ├── unit/          # 單元測試
│   ├── integration/   # 整合測試
│   ├── performance/   # 效能測試
│   └── memory/        # 記憶體測試
├── icons/             # 擴充功能圖示
├── manifest.json      # 擴充功能設定
└── package.json       # 專案設定
```

## 🎉 恭喜！

如果以上步驟都順利完成，您已經成功安裝並驗證了 KKday Lang Key Finder！

現在您可以：
1. 在 KKday 網站上快速查找翻譯 key
2. 使用 Fuse.js 模糊搜尋找到相關翻譯
3. 直接右鍵選取文字快速搜尋（最快！）
4. 直接點擊頁面元素獲取對應 key
5. 一鍵複製 key 到剪貼簿

## 📚 更多資源

- [完整使用文件](./README.md)
- [API 文件](./docs/api.md)
- [開發指南](./docs/development.md)
- [瀏覽器相容性](./docs/browser-compatibility.md)
- [Chrome Web Store 發布](./docs/chrome-web-store.md)

## 🤝 需要協助？

如果遇到任何問題，請：
1. 查看[疑難排解](#疑難排解)章節
2. 檢查 [GitHub Issues](https://github.com/b12031106/kkday-lang-key-finder/issues)
3. 建立新的 Issue 回報問題

---

**版本**: v1.0.0
**最後更新**: 2024-12-20
**作者**: KKday Development Team