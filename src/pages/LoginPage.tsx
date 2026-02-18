import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, LogIn, UserPlus } from 'lucide-react';

const LoginPage = () => {
  const { t, lang } = useLanguage();
  const { login, signup } = useUser();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError(lang === 'ur' ? 'نام درج کریں' : 'Enter your name');
      return;
    }
    if (pin.length !== 4) {
      setError(lang === 'ur' ? '4 ہندسوں کا کوڈ درج کریں' : 'Enter a 4-digit code');
      return;
    }

    setLoading(true);
    const result = isSignup ? await signup(name, pin) : await login(name, pin);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      if (result.error === 'not_found') {
        setError(lang === 'ur' ? 'نام یا کوڈ غلط ہے' : 'Name or code is incorrect');
      } else if (result.error === 'duplicate') {
        setError(lang === 'ur' ? 'یہ نام اور کوڈ پہلے سے موجود ہے' : 'This name and code already exist');
      } else {
        setError(result.error || (lang === 'ur' ? 'کچھ غلط ہو گیا' : 'Something went wrong'));
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-2">
          <BookOpen className="h-12 w-12 text-primary mx-auto" />
          <CardTitle className="text-2xl font-arabic text-primary">
            {lang === 'ur' ? 'قرآن پاک' : 'Holy Quran'}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {isSignup
              ? (lang === 'ur' ? 'نیا اکاؤنٹ بنائیں' : 'Create new account')
              : (lang === 'ur' ? 'اپنا نام اور کوڈ درج کریں' : 'Enter your name and code')
            }
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                placeholder={lang === 'ur' ? 'آپ کا نام' : 'Your name'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                className="text-center text-lg"
                dir={lang === 'ur' ? 'rtl' : 'ltr'}
              />
            </div>
            <div>
              <Input
                placeholder={lang === 'ur' ? '4 ہندسوں کا کوڈ' : '4-digit code'}
                value={pin}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPin(v);
                }}
                maxLength={4}
                inputMode="numeric"
                className="text-center text-2xl tracking-[0.5em] font-mono"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button type="submit" className="w-full gap-2" size="lg" disabled={loading}>
              {isSignup ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
              {loading
                ? (lang === 'ur' ? 'انتظار...' : 'Loading...')
                : isSignup
                  ? (lang === 'ur' ? 'اکاؤنٹ بنائیں' : 'Create Account')
                  : (lang === 'ur' ? 'داخل ہوں' : 'Login')
              }
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm"
              onClick={() => { setIsSignup(!isSignup); setError(''); }}
            >
              {isSignup
                ? (lang === 'ur' ? 'پہلے سے اکاؤنٹ ہے؟ لاگ ان کریں' : 'Already have account? Login')
                : (lang === 'ur' ? 'نیا اکاؤنٹ بنائیں' : 'Create new account')
              }
            </Button>

            <Button
              type="button"
              variant="link"
              className="w-full text-xs text-muted-foreground"
              onClick={() => navigate('/')}
            >
              {lang === 'ur' ? 'بغیر لاگ ان جاری رکھیں' : 'Continue without login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
