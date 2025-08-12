import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-xml-doc';
import DiffMatchPatch from 'diff-match-patch';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  otherCode?: string; // 用于对比的另一段代码
  isLeft?: boolean; // 是否为左侧编辑器
  onScroll?: (scrollTop: number, scrollLeft: number) => void;
  scrollTop?: number;
  scrollLeft?: number;
}

// 虚拟滚动配置
const ITEM_HEIGHT = 24; // 每行高度
const VISIBLE_ITEMS = 30; // 可见行数
const BUFFER_SIZE = 10; // 缓冲区大小

// 创建diff实例
const dmp = new DiffMatchPatch();

/**
 * 代码编辑器组件
 * 支持语法高亮、虚拟滚动、字符级差异标记和双向同步
 */
export default function CodeEditor({
  value,
  onChange,
  language,
  placeholder = '请输入代码...',
  readOnly = false,
  className = '',
  otherCode = '',
  isLeft = true,
  onScroll,
  scrollTop = 0,
  scrollLeft = 0
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [localScrollTop, setLocalScrollTop] = useState(0);
  const [localScrollLeft, setLocalScrollLeft] = useState(0);
  
  // 分割代码为行
  const lines = useMemo(() => value.split('\n'), [value]);
  const totalLines = lines.length;
  
  // 计算虚拟滚动范围
  const startIndex = useMemo(() => {
    const index = Math.floor(localScrollTop / ITEM_HEIGHT) - BUFFER_SIZE;
    return Math.max(0, index);
  }, [localScrollTop]);
  
  const endIndex = useMemo(() => {
    const index = startIndex + VISIBLE_ITEMS + BUFFER_SIZE * 2;
    return Math.min(totalLines, index);
  }, [startIndex, totalLines]);
  
  // 可见行数据
  const visibleLines = useMemo(() => {
    return lines.slice(startIndex, endIndex);
  }, [lines, startIndex, endIndex]);
  
  // 计算字符级差异
  const lineDiffs = useMemo(() => {
    if (!otherCode || !value) return [];
    
    const currentLines = value.split('\n');
    const otherLines = otherCode.split('\n');
    const maxLines = Math.max(currentLines.length, otherLines.length);
    
    const diffs = [];
    
    for (let i = 0; i < maxLines; i++) {
      const currentLine = currentLines[i] || '';
      const otherLine = otherLines[i] || '';
      
      if (currentLine !== otherLine) {
        const lineDiff = dmp.diff_main(currentLine, otherLine);
        dmp.diff_cleanupSemantic(lineDiff);
        diffs[i] = lineDiff;
      }
    }
    
    return diffs;
  }, [value, otherCode]);
  
  // 渲染带差异高亮的行
  const renderLineWithDiff = useCallback((lineContent: string, lineIndex: number) => {
    const actualLineIndex = startIndex + lineIndex;
    const diff = lineDiffs[actualLineIndex];
    
    if (!diff) {
      // 无差异，正常高亮
      const highlighted = Prism.highlight(lineContent, Prism.languages[language] || Prism.languages.plain, language);
      return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
    }
    
    // 有差异，渲染差异高亮
    return (
      <span>
        {diff.map(([type, text], index) => {
          let className = '';
          if (type === 1) { // 插入
            className = isLeft ? '' : 'diff-insert';
          } else if (type === -1) { // 删除
            className = isLeft ? 'diff-delete' : '';
          }
          
          const highlighted = Prism.highlight(text, Prism.languages[language] || Prism.languages.plain, language);
          
          return (
            <span
              key={index}
              className={className}
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          );
        })}
      </span>
    );
  }, [lineDiffs, startIndex, language, isLeft]);
  
  // 处理滚动事件
  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const newScrollTop = target.scrollTop;
    const newScrollLeft = target.scrollLeft;
    
    setLocalScrollTop(newScrollTop);
    setLocalScrollLeft(newScrollLeft);
    
    // 同步高亮层滚动
    if (highlightRef.current) {
      highlightRef.current.scrollTop = newScrollTop;
      highlightRef.current.scrollLeft = newScrollLeft;
    }
    
    // 通知父组件
    onScroll?.(newScrollTop, newScrollLeft);
  }, [onScroll]);
  
  // 外部滚动同步
  useEffect(() => {
    if (textareaRef.current && (scrollTop !== localScrollTop || scrollLeft !== localScrollLeft)) {
      textareaRef.current.scrollTop = scrollTop;
      textareaRef.current.scrollLeft = scrollLeft;
      setLocalScrollTop(scrollTop);
      setLocalScrollLeft(scrollLeft);
      
      if (highlightRef.current) {
        highlightRef.current.scrollTop = scrollTop;
        highlightRef.current.scrollLeft = scrollLeft;
      }
    }
  }, [scrollTop, scrollLeft, localScrollTop, localScrollLeft]);
  
  // 处理输入变化
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  }, [onChange]);
  
  // 处理键盘事件（Tab缩进支持）
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      
      // 恢复光标位置
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  }, [value, onChange]);
  
  return (
    <div className={`relative h-full ${className}`} ref={containerRef}>
      {/* 语法高亮层 */}
      <div
        ref={highlightRef}
        className="absolute inset-0 pointer-events-none overflow-hidden font-mono text-sm leading-6 whitespace-pre-wrap break-words"
        style={{
          paddingTop: `${startIndex * ITEM_HEIGHT}px`,
          paddingBottom: `${(totalLines - endIndex) * ITEM_HEIGHT}px`
        }}
      >
        <div className="px-4 py-2">
          {visibleLines.map((line, index) => (
            <div
              key={startIndex + index}
              className="min-h-[24px] flex items-start"
              style={{ height: `${ITEM_HEIGHT}px` }}
            >
              {/* 行号 */}
              <span className="inline-block w-12 text-right text-gray-500 select-none mr-4 flex-shrink-0">
                {startIndex + index + 1}
              </span>
              
              {/* 代码内容 */}
              <div className="flex-1 min-w-0">
                {renderLineWithDiff(line, index)}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 输入层 */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        readOnly={readOnly}
        className="absolute inset-0 w-full h-full resize-none border-none outline-none bg-transparent text-transparent caret-white font-mono text-sm leading-6 whitespace-pre-wrap break-words px-4 py-2"
        style={{
          paddingLeft: '4rem', // 为行号留出空间
          caretColor: 'white'
        }}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />
      
      {/* 空状态提示 */}
      {!value && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-gray-500 text-center">
            <div className="text-lg mb-2">📝</div>
            <div>{placeholder}</div>
          </div>
        </div>
      )}
    </div>
  );
}