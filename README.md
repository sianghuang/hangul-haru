# 한글하루 Hangul Haru · 韓文零基礎練習

獨立於 `kana-biyori` 的韓文入門網站。免安裝、免登入，純 HTML / CSS / JavaScript，可直接透過 GitHub Pages 部署。

## 功能

- **01 字母**：10 個基本母音＋14 個基本子音，另有 11 個進階母音與 5 個緊音子音可開啟
- **02 拼音節**：透過 Unicode 韓文字組拆解，將子音＋母音（可選 받침 收尾子音）與常見詞彙連結
- **03 單字**：生活、美食、旅遊、問候等 100+ 個常用韓文詞彙
- **盲看閃卡**：先看韓文，揭曉後才顯示羅馬拼音、中文與延伸字詞
- **語音**：瀏覽器 `speechSynthesis` 的 `ko-KR` 語音，需裝置有支援的語音引擎
- **本機學習進度**：當日翻卡題數、各階段見過的字與練習百分比
- **快捷鍵**：`Space` 或 `Enter` 揭曉／下一題；`→` 略過
- 手機、桌機都支援；無第三方套件、無追蹤碼

> 音節的字母分解與羅馬拼音是入門輔助。韓語連音、收尾子音、同化和音變不能單靠羅馬拼音完整呈現。

## 快速啟動

直接開啟 `index.html`，或在本資料夾執行：

```bash
python3 -m http.server 8000
```

瀏覽 `http://localhost:8000`。

## 放到新的 GitHub Repository

1. 登入 GitHub，建立**新的 Public Repository**：`hangul-haru`（不要選 `kana-biyori`）。
2. 在這個資料夾中執行：

```bash
git init
git add index.html style.css app.js README.md
git commit -m "Launch Hangul Haru Korean learning website"
git branch -M main
git remote add origin https://github.com/sianghuang/hangul-haru.git
git push -u origin main
```

3. 至 GitHub 新專案 **Settings → Pages → Build and deployment → Deploy from a branch → main / (root) → Save**。
4. 網站網址為 `https://sianghuang.github.io/hangul-haru/`（啟用 Pages 且成功部署後才能存取）。

## 檔案

```
hangul-haru/
├── index.html  # UI、教學與控制項
├── style.css   # 排版與手機版樣式
├── app.js      # 韓文字母、詞彙、練習邏輯
└── README.md   # 說明與部署步驟
```

本專案不會寫入或影響其他 Repository。