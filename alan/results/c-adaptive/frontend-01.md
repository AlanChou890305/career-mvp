1. 你同時做過 React web、React Native 和 Vue，這幾個技術棧在你的專案裡是誰決定要用哪一個的？當初選 React Native 而不是各自寫原生的判斷依據是什麼？
2. 你在專案裡用 Redux 搭配 Hooks，什麼情況下你會把狀態放進 Redux、什麼情況下留在元件內部？這條界線在你的專案裡是怎麼劃的？
3. 說明 React 的 Fiber 架構與 reconciliation 過程，以及 key 在 diff 演算法裡實際扮演什麼角色。
4. useEffect、useLayoutEffect 的執行時機差在哪裡？useMemo 和 useCallback 各自解決什麼問題，什麼時候用了反而是負擔？
5. Webpack 的 tree shaking 依賴什麼前提條件才會生效？請說明 code splitting 與 dynamic import 在打包產物上的實際差異，以及 Babel 的 plugin 與 preset 在編譯流程中的先後關係。
6. 小程序的渲染架構是邏輯層與渲染層雙線程分離，setData 的成本來自哪裡？如果要在小程序裡實作一個長列表，你會怎麼處理效能問題？
7. Canvas 繪製大量元素時，你如何處理離屏渲染與重繪範圍？和用 DOM 實作相比，效能瓶頸分別出現在哪裡？
8. 給你一棵 DOM 樹和一個目標節點，請實作虛擬 DOM 的 diff 比對，並說明你的時間複雜度。另外，你在團隊裡遇過技術方案跟同事意見不一致的情況嗎？當時怎麼收斂的？
