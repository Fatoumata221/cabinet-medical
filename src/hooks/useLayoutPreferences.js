import { useCallback, useEffect, useState } from 'react';

const SIDEBAR_WIDTH_KEY = 'layout_sidebar_width';
const SIDEBAR_COLLAPSED_KEY = 'layout_sidebar_collapsed';
const MIN_SIDEBAR = 72;
const MAX_SIDEBAR = 360;
const DEFAULT_SIDEBAR = 256;
const COLLAPSED_WIDTH = 64;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const readWidth = () => {
  try {
    const stored = parseInt(localStorage.getItem(SIDEBAR_WIDTH_KEY), 10);
    if (Number.isFinite(stored)) {
      return clamp(stored, MIN_SIDEBAR, MAX_SIDEBAR);
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_SIDEBAR;
};

export const useLayoutPreferences = () => {
  const [sidebarWidth, setSidebarWidthState] = useState(readWidth);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [isResizing, setIsResizing] = useState(false);

  const setSidebarWidth = useCallback((width) => {
    const next = clamp(width, MIN_SIDEBAR, MAX_SIDEBAR);
    setSidebarWidthState(next);
    try {
      localStorage.setItem(SIDEBAR_WIDTH_KEY, String(next));
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? 'true' : 'false');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const effectiveSidebarWidth = isCollapsed ? COLLAPSED_WIDTH : sidebarWidth;

  const startResize = useCallback(
    (event) => {
      if (isCollapsed) return;
      event.preventDefault();
      setIsResizing(true);
      const startX = event.clientX;
      const startWidth = sidebarWidth;

      const onMove = (moveEvent) => {
        const delta = moveEvent.clientX - startX;
        setSidebarWidth(startWidth + delta);
      };

      const onUp = () => {
        setIsResizing(false);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [isCollapsed, sidebarWidth, setSidebarWidth],
  );

  useEffect(() => {
    document.body.style.cursor = isResizing ? 'col-resize' : '';
    document.body.style.userSelect = isResizing ? 'none' : '';
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  return {
    sidebarWidth: effectiveSidebarWidth,
    isCollapsed,
    toggleCollapsed,
    startResize,
    isResizing,
    setSidebarWidth,
    minSidebar: MIN_SIDEBAR,
    maxSidebar: MAX_SIDEBAR,
  };
};
