import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { LayoutDashboard, Puzzle, Palette, Settings, Brain, ArrowLeft, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/modules', label: 'Modules', icon: Puzzle },
  { to: '/admin/theme', label: 'Theme', icon: Palette },
  { to: '/admin/reports', label: 'Reports', icon: Flag },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
  { to: '/admin/ai', label: 'AI', icon: Brain },
];

// NOTE: The previous self-service "create the first admin" form was removed.
// It relied on an RLS policy that let any signed-in user grant themselves the
// admin role whenever no admin row existed — a privilege-escalation path.
// Admin roles are now granted only by an existing admin (or a seeded migration).


const AdminLayout = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  // Admin status comes from the server-side role table via AuthProvider.
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">You need admin privileges to access this area.</p>
          <Button onClick={() => navigate('/auth')}>Log In</Button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen border-r border-border bg-card p-4 hidden md:block">
          <div className="mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to site
            </Button>
          </div>
          <h2 className="text-lg font-bold text-foreground mb-4 px-3">Admin Panel</h2>
          <nav className="space-y-1">
            {adminNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
