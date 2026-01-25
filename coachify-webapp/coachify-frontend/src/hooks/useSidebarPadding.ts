import { useSidebar } from '../contexts/SidebarContext';

/**
 * Hook that returns the appropriate padding class for page content
 * based on whether the sidebar is expanded or collapsed
 */
export function useSidebarPadding() {
  const { isSidebarExpanded } = useSidebar();
  return isSidebarExpanded ? 'lg:pl-64' : 'lg:pl-20';
}

