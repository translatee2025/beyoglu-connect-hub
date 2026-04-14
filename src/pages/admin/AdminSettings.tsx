import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

const settingKeys = [
  'platform_name',
  'platform_tagline',
  'platform_logo',
  'commerce_enabled',
  'venue_label',
  'product_label',
  'member_label',
];

const AdminSettings = () => {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('*')
      .then(({ data }) => {
        const map: Record<string, any> = {};
        data?.forEach((row) => { map[row.key] = row.value; });
        setSettings(map);
        setLoading(false);
      });
  }, []);

  const saveSetting = async (key: string, value: any) => {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key, value: JSON.stringify(value), updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Setting saved' });
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) return <div className="p-6 text-muted-foreground">Loading settings...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Site Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Platform Identity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Platform Name</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={settings.platform_name ?? ''}
                onChange={(e) => updateSetting('platform_name', e.target.value)}
              />
              <Button onClick={() => saveSetting('platform_name', settings.platform_name)}>Save</Button>
            </div>
          </div>
          <div>
            <Label>Tagline</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={settings.platform_tagline ?? ''}
                onChange={(e) => updateSetting('platform_tagline', e.target.value)}
              />
              <Button onClick={() => saveSetting('platform_tagline', settings.platform_tagline)}>Save</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Labels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {['venue_label', 'product_label', 'member_label'].map((key) => (
            <div key={key}>
              <Label className="capitalize">{key.replace('_', ' ')}</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={settings[key] ?? ''}
                  onChange={(e) => updateSetting(key, e.target.value)}
                />
                <Button onClick={() => saveSetting(key, settings[key])}>Save</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Commerce</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Commerce</p>
              <p className="text-sm text-muted-foreground">Allow product listings and transactions</p>
            </div>
            <Switch
              checked={settings.commerce_enabled === true || settings.commerce_enabled === 'true'}
              onCheckedChange={(checked) => {
                updateSetting('commerce_enabled', checked);
                saveSetting('commerce_enabled', checked);
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
