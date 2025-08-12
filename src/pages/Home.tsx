import React, { useState, useCallback, useEffect } from 'react';
import { Copy, Download, Upload, History, Settings, GitCompare, Trash2, Moon, Sun, Code } from 'lucide-react';
import CodeEditor from '../components/CodeEditor';
import DiffNavigator from '../components/DiffNavigator';
import DiffProgressBar from '../components/DiffProgressBar';
import HistoryPanel from '../components/HistoryPanel';
import SettingsPanel from '../components/SettingsPanel';
import { useCodeStore } from '../store/useCodeStore';
import { useDebounce } from '../hooks/useDebounce';

/**
 * 主页组件 - 码上找茬
 * 提供代码差异对比的核心功能
 */
export default function Home() {
  // Store状态
  const {
    originalCode,
    modifiedCode,
    diffLines,
    history,
    isComparing,
    selectedLanguage,
    isDarkMode,
    setOriginalCode,
    setModifiedCode,
    compareCode,
    clearCode,
    saveToHistory,
    loadFromHistory,
    clearHistory,
    exportHistory,
    importHistory,
    setLanguage,
    toggleTheme
  } = useCodeStore();
  
  // 本地状态
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentLine, setCurrentLine] = useState(0);
  const [leftScrollTop, setLeftScrollTop] = useState(0);
  const [leftScrollLeft, setLeftScrollLeft] = useState(0);
  const [rightScrollTop, setRightScrollTop] = useState(0);
  const [rightScrollLeft, setRightScrollLeft] = useState(0);
  const [autoCompare, setAutoCompare] = useState(true);
  
  // 防抖处理自动对比
  const debouncedOriginalCode = useDebounce(originalCode, 500);
  const debouncedModifiedCode = useDebounce(modifiedCode, 500);
  
  // 自动对比逻辑
  useEffect(() => {
    if (autoCompare && (debouncedOriginalCode || debouncedModifiedCode)) {
      compareCode();
    }
  }, [debouncedOriginalCode, debouncedModifiedCode, autoCompare, compareCode]);
  
  // 处理左侧编辑器滚动
  const handleLeftScroll = useCallback((scrollTop: number, scrollLeft: number) => {
    setLeftScrollTop(scrollTop);
    setLeftScrollLeft(scrollLeft);
    setRightScrollTop(scrollTop);
    setRightScrollLeft(scrollLeft);
  }, []);
  
  // 处理右侧编辑器滚动
  const handleRightScroll = useCallback((scrollTop: number, scrollLeft: number) => {
    setRightScrollTop(scrollTop);
    setRightScrollLeft(scrollLeft);
    setLeftScrollTop(scrollTop);
    setLeftScrollLeft(scrollLeft);
  }, []);
  
  // 跳转到指定行
  const navigateToLine = useCallback((lineNumber: number) => {
    const scrollTop = (lineNumber - 1) * 24; // 24px per line
    setLeftScrollTop(scrollTop);
    setRightScrollTop(scrollTop);
    setCurrentLine(lineNumber);
  }, []);
  
  // 复制代码到剪贴板
  const copyToClipboard = useCallback(async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // 这里可以添加toast提示
      console.log(`${type}代码已复制到剪贴板`);
    } catch (error) {
      console.error('复制失败:', error);
    }
  }, []);
  
  // 导出代码文件
  const exportCode = useCallback((code: string, filename: string) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);
  
  // 导入代码文件
  const importCode = useCallback((callback: (code: string) => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.js,.ts,.py,.java,.css,.json,.html,.md,.sql,.xml';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          callback(content);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, []);
  
  return (
    <div className="h-screen bg-[#0d1117] text-gray-200 flex flex-col">
      {/* 顶部工具栏 */}
      <header className="bg-[#161b22] border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* 左侧标题 */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <GitCompare className="w-6 h-6 text-blue-400" />
              <h1 className="text-xl font-bold text-gray-100">码上找茬</h1>
              <span className="text-sm text-gray-400">CodeCheckup</span>
            </div>
          </div>
          
          {/* 中间工具 */}
          <div className="flex items-center space-x-2">
            {/* 语言选择 */}
            <select
              value={selectedLanguage}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-3 py-1.5 bg-gray-800 border border-gray-600 rounded text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="css">CSS</option>
              <option value="json">JSON</option>
              <option value="html">HTML</option>
              <option value="markdown">Markdown</option>
              <option value="sql">SQL</option>
              <option value="xml">XML</option>
            </select>
            
            {/* 自动对比开关 */}
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={autoCompare}
                onChange={(e) => setAutoCompare(e.target.checked)}
                className="rounded"
              />
              <span className="text-gray-300">自动对比</span>
            </label>
            
            {/* 手动对比按钮 */}
            {!autoCompare && (
              <button
                onClick={compareCode}
                disabled={isComparing}
                className="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {isComparing ? '对比中...' : '开始对比'}
              </button>
            )}
            
            {/* 差异导航 */}
            <DiffNavigator
              diffLines={diffLines}
              currentLine={currentLine}
              onNavigate={navigateToLine}
              onReset={clearCode}
            />
          </div>
          
          {/* 右侧操作 */}
          <div className="flex items-center space-x-2">
            {/* 主题切换 */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded hover:bg-gray-700 transition-colors"
              title={isDarkMode ? '切换到浅色主题' : '切换到深色主题'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            
            {/* 历史记录 */}
            <button
              onClick={() => setShowHistory(true)}
              className="p-2 rounded hover:bg-gray-700 transition-colors"
              title="查看历史记录"
            >
              <History className="w-4 h-4" />
            </button>
            
            {/* 设置 */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded hover:bg-gray-700 transition-colors"
              title="设置"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>
      
      {/* 主要内容区域 */}
      <main className="flex-1 flex overflow-hidden">
        {/* 左侧编辑器 */}
        <div className="flex-1 flex flex-col border-r border-gray-700">
          {/* 左侧工具栏 */}
          <div className="bg-[#161b22] border-b border-gray-700 px-4 py-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">原始代码</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => copyToClipboard(originalCode, '原始')}
                className="p-1.5 rounded hover:bg-gray-700 transition-colors"
                title="复制代码"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={() => exportCode(originalCode, `original.${selectedLanguage === 'javascript' ? 'js' : selectedLanguage}`)}
                className="p-1.5 rounded hover:bg-gray-700 transition-colors"
                title="导出代码"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => importCode(setOriginalCode)}
                className="p-1.5 rounded hover:bg-gray-700 transition-colors"
                title="导入代码"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* 左侧编辑器 */}
          <div className="flex-1 relative">
            <CodeEditor
              value={originalCode}
              onChange={setOriginalCode}
              language={selectedLanguage}
              placeholder="请输入原始代码..."
              className="h-full"
              otherCode={modifiedCode}
              isLeft={true}
              onScroll={handleLeftScroll}
              scrollTop={leftScrollTop}
              scrollLeft={leftScrollLeft}
            />
          </div>
        </div>
        
        {/* 右侧编辑器 */}
        <div className="flex-1 flex flex-col">
          {/* 右侧工具栏 */}
          <div className="bg-[#161b22] border-b border-gray-700 px-4 py-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">修改代码</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => copyToClipboard(modifiedCode, '修改')}
                className="p-1.5 rounded hover:bg-gray-700 transition-colors"
                title="复制代码"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={() => exportCode(modifiedCode, `modified.${selectedLanguage === 'javascript' ? 'js' : selectedLanguage}`)}
                className="p-1.5 rounded hover:bg-gray-700 transition-colors"
                title="导出代码"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => importCode(setModifiedCode)}
                className="p-1.5 rounded hover:bg-gray-700 transition-colors"
                title="导入代码"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* 右侧编辑器 */}
          <div className="flex-1 relative flex">
            <div className="flex-1">
              <CodeEditor
                value={modifiedCode}
                onChange={setModifiedCode}
                language={selectedLanguage}
                placeholder="请输入修改后的代码..."
                className="h-full"
                otherCode={originalCode}
                isLeft={false}
                onScroll={handleRightScroll}
                scrollTop={rightScrollTop}
                scrollLeft={rightScrollLeft}
              />
            </div>
            
            {/* 差异进度条 */}
            <DiffProgressBar
              diffLines={diffLines}
              totalLines={Math.max(
                originalCode.split('\n').length,
                modifiedCode.split('\n').length
              )}
              currentLine={currentLine}
              onLineClick={navigateToLine}
            />
          </div>
        </div>
      </main>
      
      {/* 历史记录面板 */}
      <HistoryPanel
        history={history}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onLoadRecord={loadFromHistory}
        onClearHistory={clearHistory}
        onExportHistory={exportHistory}
        onImportHistory={importHistory}
      />
      
      {/* 设置面板 */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setLanguage}
      />
    </div>
  );
}