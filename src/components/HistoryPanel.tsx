import React, { useState, useRef } from 'react';
import { Clock, Download, Upload, Trash2, X, FolderOpen } from 'lucide-react';
import { HistoryRecord } from '../store/useCodeStore';

interface HistoryPanelProps {
  history: HistoryRecord[];
  isOpen: boolean;
  onClose: () => void;
  onLoadRecord: (record: HistoryRecord) => void;
  onClearHistory: () => void;
  onExportHistory: () => string;
  onImportHistory: (data: string) => boolean;
}

/**
 * 历史记录面板组件
 * 管理代码对比历史记录，支持导入导出
 */
export default function HistoryPanel({
  history,
  isOpen,
  onClose,
  onLoadRecord,
  onClearHistory,
  onExportHistory,
  onImportHistory
}: HistoryPanelProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 格式化时间显示
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // 获取代码预览
  const getCodePreview = (code: string, maxLength: number = 50): string => {
    const firstLine = code.split('\n')[0] || '';
    return firstLine.length > maxLength 
      ? firstLine.substring(0, maxLength) + '...'
      : firstLine || '(空代码)';
  };
  
  // 导出历史记录
  const handleExport = () => {
    try {
      const data = onExportHistory();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `codecheckup-history-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出失败，请重试');
    }
  };
  
  // 导入历史记录
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string;
        const success = onImportHistory(data);
        if (success) {
          alert('导入成功！');
        } else {
          alert('导入失败，请检查文件格式');
        }
      } catch (error) {
        console.error('Import failed:', error);
        alert('导入失败，请检查文件格式');
      }
    };
    reader.readAsText(file);
    
    // 重置文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // 确认清空历史
  const handleClearConfirm = () => {
    onClearHistory();
    setShowClearConfirm(false);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1e1e1e] border border-gray-600 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-600">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-200">历史记录</h2>
            <span className="text-sm text-gray-400">({history.length}/20)</span>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* 导入按钮 */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded hover:bg-gray-700 transition-all duration-200"
              title="导入历史记录"
            >
              <Upload className="w-4 h-4 text-gray-400" />
            </button>
            
            {/* 导出按钮 */}
            <button
              onClick={handleExport}
              disabled={history.length === 0}
              className="p-2 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              title="导出历史记录"
            >
              <Download className="w-4 h-4 text-gray-400" />
            </button>
            
            {/* 清空按钮 */}
            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={history.length === 0}
              className="p-2 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              title="清空历史记录"
            >
              <Trash2 className="w-4 h-4 text-gray-400" />
            </button>
            
            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="p-2 rounded hover:bg-gray-700 transition-all duration-200"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
        
        {/* 内容区域 */}
        <div className="flex-1 overflow-auto p-4">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <FolderOpen className="w-8 h-8 mb-2" />
              <p>暂无历史记录</p>
              <p className="text-sm text-gray-500 mt-1">开始对比代码后会自动保存记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((record) => (
                <div
                  key={record.id}
                  className="border border-gray-600 rounded-lg p-3 hover:bg-gray-800/50 cursor-pointer transition-all duration-200"
                  onClick={() => {
                    onLoadRecord(record);
                    onClose();
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs px-2 py-1 bg-blue-600 text-white rounded">
                        {record.lang}
                      </span>
                      <span className="text-sm text-gray-400">
                        {formatTime(record.timestamp)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-gray-400 mb-1">原始代码:</div>
                      <div className="font-mono text-gray-300 bg-gray-800 p-2 rounded text-xs">
                        {getCodePreview(record.original)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 mb-1">修改代码:</div>
                      <div className="font-mono text-gray-300 bg-gray-800 p-2 rounded text-xs">
                        {getCodePreview(record.modified)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
        
        {/* 确认清空对话框 */}
        {showClearConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-[#2a2a2a] border border-gray-600 rounded-lg p-6 max-w-sm">
              <h3 className="text-lg font-semibold text-gray-200 mb-4">确认清空</h3>
              <p className="text-gray-400 mb-6">确定要清空所有历史记录吗？此操作不可撤销。</p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 text-gray-200 rounded hover:bg-gray-600 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleClearConfirm}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  确认清空
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}