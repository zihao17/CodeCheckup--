import { create } from 'zustand';
import DiffMatchPatch from 'diff-match-patch';

// 历史记录类型定义
export interface HistoryRecord {
  id: string;
  timestamp: number;
  original: string;
  modified: string;
  lang: string;
}

// Store状态类型定义
interface CodeStore {
  // 代码内容
  originalCode: string;
  modifiedCode: string;
  
  // 差异结果（简化，主要用于导航）
  diffLines: number[];
  lineDiffs: LineDiffResult[]; // 新增：详细的行差异信息
  
  // 历史记录
  history: HistoryRecord[];
  
  // UI状态
  isComparing: boolean;
  selectedLanguage: string;
  isDarkMode: boolean;
  
  // Actions
  setOriginalCode: (code: string) => void;
  setModifiedCode: (code: string) => void;
  compareCode: () => void;
  clearCode: () => void;
  
  // 历史记录管理
  saveToHistory: () => void;
  loadFromHistory: (record: HistoryRecord) => void;
  clearHistory: () => void;
  exportHistory: () => string;
  importHistory: (data: string) => boolean;
  
  // 设置
  setLanguage: (lang: string) => void;
  toggleTheme: () => void;
}

// 创建diff实例
const dmp = new DiffMatchPatch();

// 本地存储键名
const STORAGE_KEY = 'codecheckup_history';

// 差异类型定义
type DiffType = 'equal' | 'insert' | 'delete' | 'modify';

// 行差异结果接口
interface LineDiffResult {
  type: DiffType;
  originalLine?: string;
  modifiedLine?: string;
  originalIndex?: number;
  modifiedIndex?: number;
}

// 基于LCS算法的智能行对齐函数
const computeLineDiff = (originalLines: string[], modifiedLines: string[]): LineDiffResult[] => {
  const m = originalLines.length;
  const n = modifiedLines.length;
  
  // 构建LCS动态规划表
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (originalLines[i - 1].trim() === modifiedLines[j - 1].trim()) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  // 回溯构建差异结果
  const result: LineDiffResult[] = [];
  let i = m, j = n;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && originalLines[i - 1].trim() === modifiedLines[j - 1].trim()) {
      // 相同行
      result.unshift({
        type: 'equal',
        originalLine: originalLines[i - 1],
        modifiedLine: modifiedLines[j - 1],
        originalIndex: i - 1,
        modifiedIndex: j - 1
      });
      i--;
      j--;
    } else if (i > 0 && j > 0) {
      // 修改行 - 使用字符级差异检测
      const originalLine = originalLines[i - 1];
      const modifiedLine = modifiedLines[j - 1];
      
      // 计算字符级相似度
      const similarity = calculateSimilarity(originalLine, modifiedLine);
      
      if (similarity > 0.3) { // 相似度阈值
        result.unshift({
          type: 'modify',
          originalLine,
          modifiedLine,
          originalIndex: i - 1,
          modifiedIndex: j - 1
        });
        i--;
        j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        // 删除行
        result.unshift({
          type: 'delete',
          originalLine: originalLines[i - 1],
          originalIndex: i - 1
        });
        i--;
      } else {
        // 插入行
        result.unshift({
          type: 'insert',
          modifiedLine: modifiedLines[j - 1],
          modifiedIndex: j - 1
        });
        j--;
      }
    } else if (i > 0) {
      // 删除行
      result.unshift({
        type: 'delete',
        originalLine: originalLines[i - 1],
        originalIndex: i - 1
      });
      i--;
    } else {
      // 插入行
      result.unshift({
        type: 'insert',
        modifiedLine: modifiedLines[j - 1],
        modifiedIndex: j - 1
      });
      j--;
    }
  }
  
  return result;
};

// 计算两个字符串的相似度
const calculateSimilarity = (str1: string, str2: string): number => {
  const diffs = dmp.diff_main(str1, str2);
  dmp.diff_cleanupSemantic(diffs);
  
  let totalLength = 0;
  let equalLength = 0;
  
  diffs.forEach(([type, text]) => {
    totalLength += text.length;
    if (type === 0) { // 相等部分
      equalLength += text.length;
    }
  });
  
  return totalLength > 0 ? equalLength / totalLength : 0;
};

// 从localStorage加载历史记录
const loadHistoryFromStorage = (): HistoryRecord[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      // 过滤30天内的记录
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      return data.filter((record: HistoryRecord) => record.timestamp > thirtyDaysAgo);
    }
  } catch (error) {
    console.error('Failed to load history from storage:', error);
  }
  return [];
};

// 保存历史记录到localStorage
const saveHistoryToStorage = (history: HistoryRecord[]) => {
  try {
    // 只保留最近20条记录
    const limitedHistory = history.slice(0, 20);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedHistory));
  } catch (error) {
    console.error('Failed to save history to storage:', error);
  }
};

// 获取初始主题状态
const getInitialTheme = (): boolean => {
  try {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return true; // 默认深色主题
  }
};

// 创建Zustand store
export const useCodeStore = create<CodeStore>((set, get) => {
  const initialIsDarkMode = getInitialTheme();
  
  // 初始化时设置DOM类名
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(initialIsDarkMode ? 'dark' : 'light');
  }
  
  return {
    // 初始状态
    originalCode: '',
    modifiedCode: '',
    diffLines: [],
    lineDiffs: [],
    history: loadHistoryFromStorage(),
    isComparing: false,
    selectedLanguage: 'javascript',
    isDarkMode: initialIsDarkMode,
  
  // 设置原始代码
  setOriginalCode: (code: string) => {
    set({ originalCode: code });
  },
  
  // 设置修改后代码
  setModifiedCode: (code: string) => {
    set({ modifiedCode: code });
  },
  
  // 执行代码对比 - 使用智能LCS行对齐算法
  compareCode: () => {
    const { originalCode, modifiedCode } = get();
    
    set({ isComparing: true });
    
    try {
      const originalLines = originalCode.split('\n');
      const modifiedLines = modifiedCode.split('\n');
      
      // 使用LCS算法进行智能行对齐
      const diffResult = computeLineDiff(originalLines, modifiedLines);
      
      // 提取有差异的行号
      const diffLines: number[] = [];
      
      diffResult.forEach((item, index) => {
        if (item.type !== 'equal') {
          diffLines.push(index + 1);
        }
      });
      
      set({ 
        diffLines: [...new Set(diffLines)].sort((a, b) => a - b),
        lineDiffs: diffResult,
        isComparing: false 
      });
      
      // 自动保存到历史记录
      get().saveToHistory();
      
    } catch (error) {
      console.error('Code comparison failed:', error);
      set({ isComparing: false });
    }
  },
  
  // 清空代码
  clearCode: () => {
    set({ 
      originalCode: '', 
      modifiedCode: '', 
      diffLines: [],
      lineDiffs: []
    });
  },
  
  // 保存到历史记录
  saveToHistory: () => {
    const { originalCode, modifiedCode, selectedLanguage, history } = get();
    
    if (!originalCode.trim() && !modifiedCode.trim()) return;
    
    const newRecord: HistoryRecord = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      original: originalCode,
      modified: modifiedCode,
      lang: selectedLanguage
    };
    
    const updatedHistory = [newRecord, ...history].slice(0, 20);
    set({ history: updatedHistory });
    saveHistoryToStorage(updatedHistory);
  },
  
  // 从历史记录加载
  loadFromHistory: (record: HistoryRecord) => {
    set({ 
      originalCode: record.original,
      modifiedCode: record.modified,
      selectedLanguage: record.lang,
      diffLines: [],
      lineDiffs: []
    });
  },
  
  // 清空历史记录
  clearHistory: () => {
    set({ history: [] });
    localStorage.removeItem(STORAGE_KEY);
  },
  
  // 导出历史记录
  exportHistory: () => {
    const { history } = get();
    return JSON.stringify(history, null, 2);
  },
  
  // 导入历史记录
  importHistory: (data: string) => {
    try {
      const importedHistory = JSON.parse(data) as HistoryRecord[];
      
      // 验证数据格式
      if (!Array.isArray(importedHistory)) {
        throw new Error('Invalid data format');
      }
      
      // 合并历史记录，去重
      const { history } = get();
      const existingIds = new Set(history.map(record => record.id));
      const newRecords = importedHistory.filter(record => !existingIds.has(record.id));
      
      const mergedHistory = [...newRecords, ...history]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 20);
      
      set({ history: mergedHistory });
      saveHistoryToStorage(mergedHistory);
      
      return true;
    } catch (error) {
      console.error('Failed to import history:', error);
      return false;
    }
  },
  
  // 设置编程语言
  setLanguage: (lang: string) => {
    set({ selectedLanguage: lang });
  },
  
  // 切换主题
  toggleTheme: () => {
    set(state => {
      const newIsDarkMode = !state.isDarkMode;
      const newTheme = newIsDarkMode ? 'dark' : 'light';
      
      // 更新DOM类名
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(newTheme);
      
      // 保存到localStorage
      localStorage.setItem('theme', newTheme);
      
      return { isDarkMode: newIsDarkMode };
     });
   }
 };
});