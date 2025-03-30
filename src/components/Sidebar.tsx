
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, LayoutDashboard, GitBranch, BarChart2, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SidebarProps {
  className?: string;
  children?: React.ReactNode;
  activeSection: string;
  onChangeSection: (section: string) => void;
}

export function Sidebar({ className, children, activeSection, onChangeSection }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'repositories', label: 'Repositories', icon: GitBranch },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  ];

  const handleLogout = () => {
    logout();
    toast.success('Successfully logged out');
  };

  return (
    <div
      className={cn(
        "h-screen flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-[70px]" : "w-[250px]",
        className
      )}
    >
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
        {collapsed ? (
          <Logo size="sm" className="mx-auto" />
        ) : (
          <Logo size="md" />
        )}
      </div>

      <div className="flex-grow overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onChangeSection(item.id)}
                className={cn(
                  "flex items-center w-full px-3 py-2 rounded-md text-sm transition-colors",
                  activeSection === item.id
                    ? "bg-sidebar-accent text-white"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white"
                )}
              >
                <Icon className={cn("h-5 w-5", collapsed ? "mx-auto" : "mr-3")} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {children && <div className="mt-6">{children}</div>}
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className={cn(
            "w-full text-muted-foreground hover:text-white hover:bg-sidebar-accent/50",
            collapsed ? "justify-center" : "justify-start"
          )}
        >
          <LogOut className={cn("h-5 w-5", collapsed ? "" : "mr-2")} />
          {!collapsed && "Sign out"}
        </Button>
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-[70px] -right-3 w-6 h-6 rounded-full bg-devbeacons-primary flex items-center justify-center text-white shadow-md"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
