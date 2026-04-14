import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MapPin, FileText, CheckCircle } from 'lucide-react';

interface Stats {
  users: number;
  venues: number;
  posts: number;
  claimedVenues: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({ users: 0, venues: 0, posts: 0, claimedVenues: 0 });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [usersRes, venuesRes, postsRes, claimedRes, logsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('venues').select('id', { count: 'exact', head: true }),
        supabase.from('lost_found_posts').select('id', { count: 'exact', head: true }),
        supabase.from('venues').select('id', { count: 'exact', head: true }).eq('is_claimed', true),
        supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(10),
      ]);

      setStats({
        users: usersRes.count ?? 0,
        venues: venuesRes.count ?? 0,
        posts: postsRes.count ?? 0,
        claimedVenues: claimedRes.count ?? 0,
      });
      setRecentLogs(logsRes.data ?? []);
      setLoading(false);
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats.users, icon: Users, color: 'text-blue-500' },
    { label: 'Venues', value: stats.venues, icon: MapPin, color: 'text-green-500' },
    { label: 'Posts', value: stats.posts, icon: FileText, color: 'text-purple-500' },
    { label: 'Claimed Venues', value: stats.claimedVenues, icon: CheckCircle, color: 'text-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loading ? '...' : stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No activity recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{log.action}</p>
                    <p className="text-xs text-muted-foreground">{log.entity_type} {log.entity_id}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
