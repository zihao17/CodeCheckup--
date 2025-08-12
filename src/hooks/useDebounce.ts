import { useEffect, useState } from 'react';

/**
 * 防抖Hook
 * 用于延迟执行频繁变化的值，避免过度触发操作
 * 
 * @param value 需要防抖的值
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的值
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // 设置定时器，在delay时间后更新防抖值
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // 清理函数：如果value在delay时间内再次变化，清除之前的定时器
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * 防抖回调Hook
 * 用于防抖执行回调函数
 * 
 * @param callback 需要防抖的回调函数
 * @param delay 延迟时间（毫秒）
 * @param deps 依赖数组
 * @returns 防抖后的回调函数
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const [debouncedCallback, setDebouncedCallback] = useState<T>(() => callback);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCallback(() => callback);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [callback, delay, ...deps]);

  return debouncedCallback;
}

/**
 * 防抖搜索Hook
 * 专门用于搜索场景的防抖处理
 * 
 * @param searchTerm 搜索词
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的搜索词
 */
export function useDebouncedSearch(searchTerm: string, delay: number = 300): string {
  return useDebounce(searchTerm, delay);
}