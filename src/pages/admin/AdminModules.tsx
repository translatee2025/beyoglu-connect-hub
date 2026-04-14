import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface ModuleSetting {
  id: string;
  module_key: string;
  label: string;
  icon: string | null;
  is_enabled: boolean;
  sort_order: number;
}

const AdminModules = () => {
  const [modules, setModules] = useState<ModuleSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    supabase
      .from('module_settings')
      .select('*')
      .order('sort_order')
      .then(({ data }) => {
        if (data) setModules(data);
        setLoading(false);
      });
  }, []);

  const toggleModule = async (id: string, enabled: boolean) => {
    setModules((prev) => prev.map((m) => (m.id === id ? { ...m, is_enabled: enabled } : m)));

    const { error } = await supabase
      .from('module_settings')
      .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Module updated' });
    }
  };

  if (loading) return <div className="p-6 text-muted-foreground">Loading modules...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Modules</h1>
      <Card>
        <CardHeader>
          <CardTitle>Platform Modules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {modules.map((mod) => (
            <div key={mod.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div>
                <p className="font-medium">{mod.label}</p>
                <p className="text-sm text-muted-foreground">{mod.module_key}</p>
              </div>
              <Switch
                checked={mod.is_enabled}
                onCheckedChange={(checked) => toggleModule(mod.id, checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminModules;
