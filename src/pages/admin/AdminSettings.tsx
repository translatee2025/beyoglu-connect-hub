import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const cmsKeys = [
  { key: 'hero_title', label: 'Hero Title', multiline: false },
  { key: 'hero_subtitle', label: 'Hero Subtitle', multiline: true },
  { key: 'hero_cta_primary', label: 'Hero CTA Primary Button', multiline: false },
  { key: 'hero_cta_secondary', label: 'Hero CTA Secondary Button', multiline: false },
  { key: 'features_heading', label: 'Features Heading', multiline: false },
  { key: 'features_subtitle', label: 'Features Subtitle', multiline: true },
  { key: 'feature_1_title', label: 'Feature 1 Title', multiline: false },
  { key: 'feature_1_desc', label: 'Feature 1 Description', multiline: true },
  { key: 'feature_2_title', label: 'Feature 2 Title', multiline: false },
  { key: 'feature_2_desc', label: 'Feature 2 Description', multiline: true },
  { key: 'feature_3_title', label: 'Feature 3 Title', multiline: false },
  { key: 'feature_3_desc', label: 'Feature 3 Description', multiline: true },
  { key: 'feature_4_title', label: 'Feature 4 Title', multiline: false },
  { key: 'feature_4_desc', label: 'Feature 4 Description', multiline: true },
  { key: 'cta_heading', label: 'CTA Heading', multiline: false },
  { key: 'cta_subtitle', label: 'CTA Subtitle', multiline: true },
  { key: 'cta_button', label: 'CTA Button Text', multiline: false },
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

  const getCmsValue = (key: string, lang: string) => {
    const val = settings[key];
    if (typeof val === 'object' && val !== null) return val[lang] || '';
    return '';
  };

  const setCmsValue = (key: string, lang: string, text: string) => {
    const current = typeof settings[key] === 'object' && settings[key] !== null ? settings[key] : {};
    updateSetting(key, { ...current, [lang]: text });
  };

  if (loading) return <div className="p-6 text-muted-foreground">Loading settings...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Site Settings</h1>

      <Card>
        <CardHeader><CardTitle>Platform Identity</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Platform Name</Label>
            <div className="flex gap-2 mt-1">
              <Input value={settings.platform_name ?? ''} onChange={(e) => updateSetting('platform_name', e.target.value)} />
              <Button onClick={() => saveSetting('platform_name', settings.platform_name)}>Save</Button>
            </div>
          </div>
          <div>
            <Label>Tagline</Label>
            <div className="flex gap-2 mt-1">
              <Input value={settings.platform_tagline ?? ''} onChange={(e) => updateSetting('platform_tagline', e.target.value)} />
              <Button onClick={() => saveSetting('platform_tagline', settings.platform_tagline)}>Save</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Labels</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {['venue_label', 'product_label', 'member_label'].map((key) => (
            <div key={key}>
              <Label className="capitalize">{key.replace('_', ' ')}</Label>
              <div className="flex gap-2 mt-1">
                <Input value={settings[key] ?? ''} onChange={(e) => updateSetting(key, e.target.value)} />
                <Button onClick={() => saveSetting(key, settings[key])}>Save</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Commerce</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Commerce</p>
              <p className="text-sm text-muted-foreground">Allow product listings and transactions</p>
            </div>
            <Switch
              checked={settings.commerce_enabled === true || settings.commerce_enabled === 'true'}
              onCheckedChange={(checked) => { updateSetting('commerce_enabled', checked); saveSetting('commerce_enabled', checked); }}
            />
          </div>
        </CardContent>
      </Card>

      {/* CMS Homepage Content */}
      <Card>
        <CardHeader>
          <CardTitle>Homepage Content (CMS)</CardTitle>
          <p className="text-sm text-muted-foreground">Edit hero text, features, and CTA for each language</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tr">
            <TabsList className="mb-4">
              <TabsTrigger value="tr">Türkçe</TabsTrigger>
              <TabsTrigger value="en">English</TabsTrigger>
            </TabsList>
            {['tr', 'en'].map((lang) => (
              <TabsContent key={lang} value={lang} className="space-y-4">
                {cmsKeys.map((item) => (
                  <div key={item.key}>
                    <Label className="text-xs text-muted-foreground">{item.label}</Label>
                    <div className="flex gap-2 mt-1">
                      {item.multiline ? (
                        <Textarea
                          value={getCmsValue(item.key, lang)}
                          onChange={(e) => setCmsValue(item.key, lang, e.target.value)}
                          rows={2}
                          className="flex-1"
                        />
                      ) : (
                        <Input
                          value={getCmsValue(item.key, lang)}
                          onChange={(e) => setCmsValue(item.key, lang, e.target.value)}
                          className="flex-1"
                        />
                      )}
                      <Button size="sm" onClick={() => saveSetting(item.key, settings[item.key])}>Save</Button>
                    </div>
                  </div>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
