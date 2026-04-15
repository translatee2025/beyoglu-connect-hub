import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/providers/LanguageProvider';
import { config } from '@/config';
import { ArrowLeft, ArrowRight, Mail, Lock, Phone, User as UserIcon } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const totalSteps = isLogin ? 1 : 3;
  const progress = (step / totalSteps) * 100;

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate('/');
    } catch (error: any) {
      toast({ title: t('common.error', 'Error'), description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!phone.trim()) {
      toast({ title: t('auth.phone_required', 'Phone number is required'), variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { display_name: displayName || email.split('@')[0], phone },
        },
      });
      if (error) throw error;
      if (data.user) {
        await supabase.from('profiles').update({ phone, display_name: displayName || email.split('@')[0] }).eq('user_id', data.user.id);
      }
      toast({ title: t('auth.check_email', 'Check your email'), description: t('auth.verification_sent', 'We sent you a verification link to complete your signup.') });
      setStep(1);
      setIsLogin(true);
    } catch (error: any) {
      toast({ title: t('common.error', 'Error'), description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) handleLogin();
    else if (step < totalSteps) setStep(step + 1);
    else handleSignUp();
  };

  const canProceed = () => {
    if (isLogin) return email && password;
    if (step === 1) return email.includes('@');
    if (step === 2) return password.length >= 6;
    if (step === 3) return phone.trim().length >= 5;
    return false;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {!isLogin && totalSteps > 1 && (
            <div className="mb-4">
              <Progress value={progress} className="h-1.5" />
              <p className="text-xs text-muted-foreground mt-2">{t('common.step_of', `Step ${step} of ${totalSteps}`).replace('{step}', String(step)).replace('{total}', String(totalSteps))}</p>
            </div>
          )}
          <CardTitle className="text-2xl">
            {isLogin ? t('auth.welcome_back', 'Welcome Back') : step === 1 ? t('auth.create_account', 'Create Account') : step === 2 ? t('auth.set_password', 'Set Password') : t('auth.your_info', 'Your Info')}
          </CardTitle>
          <CardDescription>
            {isLogin
              ? `${t('auth.login_to', 'Log in to')} ${config.platformName}`
              : step === 1
              ? t('auth.email_start', 'Enter your email to get started')
              : step === 2
              ? t('auth.secure_password', 'Choose a secure password')
              : t('auth.last_step', 'One last step — tell us about you')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isLogin && (
              <>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Mail className="w-4 h-4" /> {t('auth.email', 'Email')}</Label>
                  <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Lock className="w-4 h-4" /> {t('auth.password', 'Password')}</Label>
                  <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                </div>
              </>
            )}
            {!isLogin && step === 1 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Mail className="w-4 h-4" /> {t('auth.email', 'Email')}</Label>
                <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
              </div>
            )}
            {!isLogin && step === 2 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Lock className="w-4 h-4" /> {t('auth.choose_password', 'Choose Password')}</Label>
                <Input type="password" placeholder={t('auth.min_chars', 'Min. 6 characters')} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoFocus />
                <p className="text-xs text-muted-foreground">{t('auth.min_chars', 'Must be at least 6 characters')}</p>
              </div>
            )}
            {!isLogin && step === 3 && (
              <>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><UserIcon className="w-4 h-4" /> {t('auth.display_name', 'Display Name')}</Label>
                  <Input type="text" placeholder={t('auth.display_name', 'Your name')} value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoFocus />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Phone className="w-4 h-4" /> {t('auth.phone', 'Phone Number')} <span className="text-destructive">*</span></Label>
                  <Input type="tel" placeholder="+90 5xx xxx xx xx" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                  <p className="text-xs text-muted-foreground">{t('auth.phone_required', 'Required for community verification')}</p>
                </div>
              </>
            )}
            <div className="flex gap-2">
              {!isLogin && step > 1 && (
                <Button type="button" variant="outline" onClick={() => setStep(step - 1)} className="gap-1">
                  <ArrowLeft className="w-4 h-4" /> {t('auth.back', 'Back')}
                </Button>
              )}
              <Button type="submit" className="flex-1 gap-1" disabled={loading || !canProceed()}>
                {loading ? t('auth.loading', 'Loading...') : isLogin ? t('auth.login', 'Log In') : step < totalSteps ? <>{t('auth.next', 'Next')} <ArrowRight className="w-4 h-4" /></> : t('auth.signup_btn', 'Create Account')}
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center">
            <button type="button" onClick={() => { setIsLogin(!isLogin); setStep(1); }} className="text-sm text-muted-foreground hover:text-foreground">
              {isLogin ? t('auth.no_account', "Don't have an account? Sign Up") : t('auth.has_account', 'Already have an account? Log In')}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
