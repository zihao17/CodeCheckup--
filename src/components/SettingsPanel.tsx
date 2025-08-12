import React from 'react';
import { Settings, X, Moon, Sun, Code } from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
}

// 支持的编程语言列表
const SUPPORTED_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', extension: '.js' },
  { value: 'typescript', label: 'TypeScript', extension: '.ts' },
  { value: 'python', label: 'Python', extension: '.py' },
  { value: 'java', label: 'Java', extension: '.java' },
  { value: 'css', label: 'CSS', extension: '.css' },
  { value: 'json', label: 'JSON', extension: '.json' },
  { value: 'html', label: 'HTML', extension: '.html' },
  { value: 'markdown', label: 'Markdown', extension: '.md' },
  { value: 'sql', label: 'SQL', extension: '.sql' },
  { value: 'xml', label: 'XML', extension: '.xml' }
];

/**
 * 设置面板组件
 * 提供主题切换、语言选择等配置选项
 */
export default function SettingsPanel({
  isOpen,
  onClose,
  isDarkMode,
  onToggleTheme,
  selectedLanguage,
  onLanguageChange
}: SettingsPanelProps) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1e1e1e] border border-gray-600 rounded-lg w-full max-w-md">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-600">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-200">设置</h2>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-gray-700 transition-all duration-200"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        
        {/* 内容区域 */}
        <div className="p-4 space-y-6">
          {/* 主题设置 */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center space-x-2">
              {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              <span>主题模式</span>
            </h3>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={onToggleTheme}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-gray-200'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>深色</span>
              </button>
              
              <button
                onClick={onToggleTheme}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
                  !isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-gray-200'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>浅色</span>
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              选择您偏好的界面主题
            </p>
          </div>
          
          {/* 语言设置 */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center space-x-2">
              <Code className="w-4 h-4" />
              <span>编程语言</span>
            </h3>
            
            <select
              value={selectedLanguage}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label} ({lang.extension})
                </option>
              ))}
            </select>
            
            <p className="text-xs text-gray-500 mt-2">
              选择代码的编程语言以获得更好的语法高亮效果
            </p>
          </div>
          
          {/* 性能设置说明 */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">性能优化</h3>
            
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center justify-between">
                <span>虚拟滚动</span>
                <span className="text-green-400">已启用</span>
              </div>
              <div className="flex items-center justify-between">
                <span>防抖对比</span>
                <span className="text-green-400">500ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span>历史记录</span>
                <span className="text-green-400">最近20条</span>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              这些优化设置可以提升大文件处理性能
            </p>
          </div>
        </div>
        
        {/* 底部信息 */}
        <div className="p-4 border-t border-gray-600 text-center">
          <p className="text-xs text-gray-500">
            码上找茬 (CodeCheckup) v1.0.0
          </p>
          <p className="text-xs text-gray-600 mt-1">
            专业的代码差异对比工具
          </p>
        </div>
      </div>
    </div>
  );
}