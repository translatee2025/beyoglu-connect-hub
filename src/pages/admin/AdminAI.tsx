import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const AdminAI = () => {
  const [provider, setProvider] = useState('lovable');
  const [apiKey, setApiKey] = useState('');
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [aiModeration, setAiModeration] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    supabase.from('site_settings').select('*').then(({ data }) => {
      data?.forEach((row) => {
        if (row.key === 'ai_provider') setProvider(row.value as string || 'lovable');
        if (row.key === 'ai_api_key') setApiKey(row.value as string || '');
        if (row.key === 'ai_auto_translate') setAutoTranslate(row.value === true || row.value === 'true');
        if (row.key === 'ai_moderation') setAiModeration(row.value === true || row.value === 'true');
      });
      setLoading(false);
    });
  }, []);

  const save = async (key: string, value: any) => {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key, value: JSON.stringify(value), updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Setting saved' });
    }
  };

  if (loading) return <div className="p-6 text-muted-foreground">Loading AI settings...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">AI Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>AI Provider</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Provider</Label>
            <Select value={provider} onValueChange={(v) => { setProvider(v); save('ai_provider', v); }}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lovable">Lovable AI (Built-in)</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="google">Google AI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {provider !== 'lovable' && (
            <div>
              <Label>API Key</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                />
                <Button onClick={() => save('ai_api_key', apiKey)}>Save</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto-Translate Content</p>
              <p className="text-sm text-muted-foreground">Automatically translate posts and listings</p>
            </div>
            <Switch
              checked={autoTranslate}
              onCheckedChange={(v) => { setAutoTranslate(v); save('ai_auto_translate', v); }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">AI Content Moderation</p>
              <p className="text-sm text-muted-foreground">Flag inappropriate content automatically</p>
            </div>
            <Switch
              checked={aiModeration}
              onCheckedChange={(v) => { setAiModeration(v); save('ai_moderation', v); }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAI;
