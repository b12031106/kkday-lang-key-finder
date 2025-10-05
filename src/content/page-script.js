/**
 * Page Script - 注入到頁面執行環境中
 * 可以直接存取頁面的全域變數
 */

(function() {
  'use strict';

  // 擷取翻譯資料的函數
  function extractTranslationData() {
    let data = null;

    // 檢查 __NUXT__
    if (typeof __NUXT__ !== 'undefined') {
      if (__NUXT__.state) {
        // 列出所有的 state keys
        const stateKeys = Object.keys(__NUXT__.state);

        // 尋找可能的翻譯資料
        for (const key of stateKeys) {
          if (key.includes('i18n') || key.includes('lang') || key.includes('locale') || key.startsWith('$s')) {
            const value = __NUXT__.state[key];
            if (value && typeof value === 'object' && Object.keys(value).length > 0) {
              data = value;
              break;
            }
          }
        }
      }
    }

    // 檢查 __NEXT_DATA__
    if (!data && typeof __NEXT_DATA__ !== 'undefined') {
      if (__NEXT_DATA__.props?.pageProps) {
        const pageProps = __NEXT_DATA__.props.pageProps;

        // 檢查常見的 i18n 屬性
        const checkKeys = ['translations', 'i18n', 'messages', '_nextI18Next'];
        for (const key of checkKeys) {
          if (pageProps[key]) {
            data = pageProps[key];
            break;
          }
        }
      }
    }

    // 檢查 __INIT_STATE__
    if (!data && typeof __INIT_STATE__ !== 'undefined') {
      if (__INIT_STATE__.lang) {
        data = __INIT_STATE__.lang;
      }
    }

    // 檢查其他全域變數
    if (!data) {
      // 列出所有可能相關的全域變數
      const globalVars = [];
      for (const key in window) {
        if (key.includes('i18n') || key.includes('I18n') ||
            key.includes('trans') || key.includes('Trans') ||
            key.includes('locale') || key.includes('Locale') ||
            key.includes('lang') || key.includes('Lang') ||
            key.startsWith('__') || key.startsWith('$')) {
          globalVars.push(key);
        }
      }

      // 嘗試從這些變數中找資料
      for (const key of globalVars) {
        try {
          const value = window[key];
          if (value && typeof value === 'object' && !value.nodeName) {
            // 檢查是否包含翻譯資料的特徵
            const valueKeys = Object.keys(value);
            if (valueKeys.length > 0 && valueKeys.length < 10000) {
              // 檢查是否有字串值（可能是翻譯）
              const hasStrings = valueKeys.some(k => typeof value[k] === 'string');
              const hasObjects = valueKeys.some(k => typeof value[k] === 'object');

              if (hasStrings || hasObjects) {
                // 如果看起來像翻譯資料，記錄它
                if (valueKeys.length > 10) {
                  data = value;
                  break;
                }
              }
            }
          }
        } catch (e) {
          // 忽略無法存取的屬性
        }
      }
    }

    return data;
  }

  // 深度複製並清理物件，移除不可序列化的屬性
  function sanitizeData(obj, maxDepth = 10, currentDepth = 0) {
    if (currentDepth > maxDepth) {
      return null;
    }

    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeData(item, maxDepth, currentDepth + 1)).filter(item => item !== null);
    }

    // 建立新物件，只包含可序列化的屬性
    const cleaned = {};
    for (const key in obj) {
      try {
        const value = obj[key];

        // 跳過函數、DOM 節點、和其他不可序列化的類型
        if (typeof value === 'function') {
          continue;
        }
        if (value instanceof Node) {
          continue;
        }
        if (value instanceof Window) {
          continue;
        }
        if (value instanceof Element) {
          continue;
        }

        // 遞迴處理物件和陣列
        if (typeof value === 'object' && value !== null) {
          const sanitized = sanitizeData(value, maxDepth, currentDepth + 1);
          if (sanitized !== null) {
            cleaned[key] = sanitized;
          }
        } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          cleaned[key] = value;
        }
      } catch (e) {
        // 跳過無法存取的屬性
      }
    }
    return cleaned;
  }

  // 立即擷取資料
  const translationData = extractTranslationData();

  // 清理並傳送資料
  try {
    const cleanedData = translationData ? sanitizeData(translationData) : null;

    window.postMessage({
      type: 'I18N_KEY_FINDER_DATA',
      data: cleanedData,
      debug: {
        hasNuxt: typeof __NUXT__ !== 'undefined',
        hasNextData: typeof __NEXT_DATA__ !== 'undefined',
        hasInitState: typeof __INIT_STATE__ !== 'undefined',
        globalKeys: Object.keys(window).filter(k =>
          k.startsWith('__') ||
          k.includes('i18n') ||
          k.includes('I18n')
        ).slice(0, 50)
      }
    }, '*');
  } catch (error) {
    // 如果完整資料無法傳送，至少傳送除錯資訊
    try {
      window.postMessage({
        type: 'I18N_KEY_FINDER_DATA',
        data: null,
        error: error.message,
        debug: {
          hasNuxt: typeof __NUXT__ !== 'undefined',
          hasNextData: typeof __NEXT_DATA__ !== 'undefined',
          hasInitState: typeof __INIT_STATE__ !== 'undefined'
        }
      }, '*');
    } catch (e) {
      // Failed to send error message
    }
  }

  // 也在延遲後再試一次
  setTimeout(() => {
    const delayedData = extractTranslationData();
    if (delayedData) {
      try {
        const cleanedDelayedData = sanitizeData(delayedData);
        window.postMessage({
          type: 'I18N_KEY_FINDER_DATA',
          data: cleanedDelayedData,
          delayed: true
        }, '*');
      } catch (error) {
        // Error sending delayed data
      }
    }
  }, 2000);

})();