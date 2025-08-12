import React from 'react';
import { ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';

interface DiffNavigatorProps {
  diffLines: number[];
  currentLine?: number;
  onNavigate: (lineNumber: number) => void;
  onReset?: () => void;
}

/**
 * 差异导航器组件
 * 用于显示差异行位置并支持快速跳转
 */
export default function DiffNavigator({
  diffLines,
  currentLine = 0,
  onNavigate,
  onReset
}: DiffNavigatorProps) {
  // 找到当前行在差异列表中的位置
  const currentDiffIndex = diffLines.findIndex(line => line >= currentLine);
  const hasPrevious = currentDiffIndex > 0;
  const hasNext = currentDiffIndex < diffLines.length - 1 && currentDiffIndex !== -1;
  
  // 跳转到上一个差异
  const goToPrevious = () => {
    if (hasPrevious) {
      const prevIndex = currentDiffIndex - 1;
      onNavigate(diffLines[prevIndex]);
    }
  };
  
  // 跳转到下一个差异
  const goToNext = () => {
    if (hasNext) {
      const nextIndex = currentDiffIndex + 1;
      onNavigate(diffLines[nextIndex]);
    } else if (currentDiffIndex === -1 && diffLines.length > 0) {
      // 如果当前不在差异行，跳转到第一个差异
      onNavigate(diffLines[0]);
    }
  };
  
  if (diffLines.length === 0) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-800 rounded-lg">
        <span className="text-sm text-gray-400">无差异</span>
        {onReset && (
          <button
            onClick={onReset}
            className="p-1 rounded hover:bg-gray-700 transition-colors"
            title="重置对比"
          >
            <RotateCcw className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>
    );
  }
  
  return (
    <div className="flex items-center space-x-2 px-3 py-2 bg-gray-800 rounded-lg">
      {/* 差异统计 */}
      <span className="text-sm text-gray-300">
        {diffLines.length} 处差异
      </span>
      
      {/* 当前位置 */}
      {currentDiffIndex !== -1 && (
        <span className="text-xs text-gray-400">
          ({currentDiffIndex + 1}/{diffLines.length})
        </span>
      )}
      
      {/* 导航按钮 */}
      <div className="flex items-center space-x-1">
        <button
          onClick={goToPrevious}
          disabled={!hasPrevious}
          className="p-1 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="上一个差异"
        >
          <ChevronUp className="w-4 h-4 text-gray-400" />
        </button>
        
        <button
          onClick={goToNext}
          disabled={!hasNext && currentDiffIndex !== -1}
          className="p-1 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="下一个差异"
        >
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      
      {/* 重置按钮 */}
      {onReset && (
        <button
          onClick={onReset}
          className="p-1 rounded hover:bg-gray-700 transition-colors"
          title="重置对比"
        >
          <RotateCcw className="w-4 h-4 text-gray-400" />
        </button>
      )}
    </div>
  );
}