/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarContextType {
  sidebarContent: ReactNode | null;
  setSidebarContent: (content: ReactNode) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [sidebarContent, setSidebarContent] = useState<ReactNode | null>(null);

  return (
    <SidebarContext.Provider value={{ sidebarContent, setSidebarContent }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

export function SidebarPortal({ children }: { children: ReactNode }) {
  const { setSidebarContent } = useSidebar();
  
  // Set the sidebar content when the component mounts
  React.useEffect(() => {
    setSidebarContent(children);
    
    // Clean up when the component unmounts
    return () => {
      setSidebarContent(null);
    };
  }, [children, setSidebarContent]);
  
  // The portal doesn't render anything itself
  return null;
}