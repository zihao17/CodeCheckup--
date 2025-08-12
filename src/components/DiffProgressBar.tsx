import React from 'react';

interface DiffProgressBarProps {
  diffLines: number[];
  totalLines: number;
  currentLine?: number;
  onLineClick: (lineNumber: number) => void;
}

/**
 * 差异进度条组件
 * 在右侧显示差异行的可视化进度条
 */
export default function DiffProgressBar({
  diffLines,
  totalLines,
  currentLine = 0,
  onLineClick
}: DiffProgressBarProps) {
  if (diffLines.length === 0 || totalLines === 0) {
    return null;
  }
  
  return (
    <div className="w-2 h-full bg-gray-800 relative cursor-pointer group">
      {/* 差异标记 */}
      {diffLines.map((lineNumber) => {
        const percentage = (lineNumber / totalLines) * 100;
        const isActive = Math.abs(lineNumber - currentLine) < 3;
        
        return (
          <div
            key={lineNumber}
            className={`absolute w-full h-1 transition-all duration-200 ${
              isActive 
                ? 'bg-yellow-400 shadow-lg' 
                : 'bg-red-400 hover:bg-red-300'
            }`}
            style={{ top: `${percentage}%` }}
            onClick={() => onLineClick(lineNumber)}
            title={`第 ${lineNumber + 1} 行有差异`}
          />
        );
      })}
      
      {/* 当前位置指示器 */}
      {totalLines > 0 && (
        <div
          className="absolute w-full h-0.5 bg-blue-400 transition-all duration-200"
          style={{ top: `${(currentLine / totalLines) * 100}%` }}
        />
      )}
      
      {/* 悬停提示 */}
      <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
        {diffLines.length} 处差异
      </div>
    </div>
  );
}