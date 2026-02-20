import { useLanguage } from '@/contexts/LanguageContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useUser } from '@/contexts/UserContext';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Globe, Moon, Sun, Type, FileText, LogIn, LogOut, CloudUpload,
  User, Volume2, ChevronRight, Shield, Smartphone, BookOpen,
  Info, Trash2, Check, Gauge, Brain
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { QARI_LIST } from '@/hooks/useQuranAudio';
import { QariId, AudioSpeed } from '@/types/quran';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { cn } from '@/lib/utils';

const SettingsPage = () => {
  const { t, lang, setLang } = useLanguage();
  const { settings, updateSettings } = useSettings();
  const { user, logout, syncToCloud } = useUser();
  const navigate = useNavigate();

  const handleSync = async () => {
    await syncToCloud();
    toast({ title: lang === 'ur' ? 'ڈیٹا محفوظ ہو گیا ☁️' : 'Data saved to cloud ☁️', duration: 2000 });
  };

  const handleClearData = () => {
    // The AlertDialog component will handle the confirmation
  };

  const SectionHeader = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
    <div className="flex items-center gap-2 mb-3">
      <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-primary/10">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
    </div>
  );

  const SettingRow = ({ label, description, children, noBorder }: { label: string; description?: string; children: React.ReactNode; noBorder?: boolean }) => (
    <div className={cn('flex items-center justify-between py-3', !noBorder && 'border-b border-border/50')}>
      <div className="flex-1 min-w-0 pr-3">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-sm">
        <div className="mx-auto max-w-lg px-4 py-3">
          <h1 className="text-xl font-bold text-primary">{t('settings')}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {lang === 'ur' ? 'ایپ کی ترتیبات اور تخصیص' : 'App preferences & customization'}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4 space-y-4">
        {/* Account Section */}
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <SectionHeader icon={User} title={lang === 'ur' ? 'اکاؤنٹ' : 'Account'} />
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {lang === 'ur' ? 'لاگ ان ہے' : 'Logged in'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={handleSync}>
                    <CloudUpload className="h-3.5 w-3.5" />
                    {lang === 'ur' ? 'ڈیٹا محفوظ کریں' : 'Save to Cloud'}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={logout}>
                    <LogOut className="h-3.5 w-3.5" />
                    {lang === 'ur' ? 'لاگ آؤٹ' : 'Logout'}
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" className="w-full gap-2 h-12" onClick={() => navigate('/login')}>
                <LogIn className="h-4 w-4" />
                {lang === 'ur' ? 'لاگ ان / اکاؤنٹ بنائیں' : 'Login / Create Account'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <SectionHeader icon={Smartphone} title={lang === 'ur' ? 'ظاہری شکل' : 'Appearance'} />
            
            <SettingRow
              label={t('darkMode')}
              description={lang === 'ur' ? 'ڈارک تھیم آن/آف کریں' : 'Toggle dark theme'}
            >
              <div className="flex items-center gap-2">
                {settings.darkMode ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
                <Switch
                  checked={settings.darkMode}
                  onCheckedChange={(v) => updateSettings({ darkMode: v })}
                />
              </div>
            </SettingRow>

            <SettingRow
              label={t('language')}
              description={lang === 'ur' ? 'ایپ کی زبان تبدیل کریں' : 'Change app language'}
              noBorder
            >
              <div className="flex gap-1.5">
                <Button
                  variant={lang === 'ur' ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs px-3"
                  onClick={() => setLang('ur')}
                >
                  {lang === 'ur' && <Check className="h-3 w-3 mr-1" />}
                  اردو
                </Button>
                <Button
                  variant={lang === 'en' ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs px-3"
                  onClick={() => setLang('en')}
                >
                  {lang === 'en' && <Check className="h-3 w-3 mr-1" />}
                  English
                </Button>
              </div>
            </SettingRow>
          </CardContent>
        </Card>

        {/* Reading Settings */}
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <SectionHeader icon={BookOpen} title={lang === 'ur' ? 'تلاوت کی ترتیبات' : 'Reading Settings'} />
            
            {/* Font Size */}
            <div className="py-3 border-b border-border/50">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{t('fontSize')}</p>
                  <p className="text-xs text-muted-foreground">{settings.fontSize}px</p>
                </div>
                <Type className="h-4 w-4 text-muted-foreground" />
              </div>
              <Slider
                value={[settings.fontSize]}
                onValueChange={([v]) => updateSettings({ fontSize: v })}
                min={18}
                max={42}
                step={2}
                className="my-2"
              />
              <p className="font-arabic text-center rtl mt-2 p-2 rounded-lg bg-muted/50" style={{ fontSize: `${settings.fontSize}px` }}>
                بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ
              </p>
            </div>

            {/* Page Format */}
            <div className="py-3">
              <p className="text-sm font-medium text-foreground mb-1">{t('pageFormat')}</p>
              <p className="text-xs text-muted-foreground mb-2">
                {lang === 'ur' ? 'صفحہ پڑھائی کا فارمیٹ selected کریں' : 'Select page reading format'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
                    settings.pageFormat === '16-line'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                  onClick={() => updateSettings({ pageFormat: '16-line' })}
                >
                  <FileText className={cn('h-5 w-5', settings.pageFormat === '16-line' ? 'text-primary' : 'text-muted-foreground')} />
                  <span className="text-xs font-medium">{t('line16')}</span>
                </button>
                <button
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
                    settings.pageFormat === '15-line'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                  onClick={() => updateSettings({ pageFormat: '15-line' })}
                >
                  <FileText className={cn('h-5 w-5', settings.pageFormat === '15-line' ? 'text-primary' : 'text-muted-foreground')} />
                  <span className="text-xs font-medium">{t('line15')}</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hifz Settings */}
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <SectionHeader icon={Brain} title={lang === 'ur' ? 'حفظ ترتیبات' : 'Hifz Settings'} />
            
            <SettingRow
              label={t('hifzMode')}
              description={lang === 'ur' ? 'حفظ موڈ فعال کریں' : 'Enable memorization mode'}
            >
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-muted-foreground" />
                <Switch
                  checked={settings.hifzModeEnabled ?? true}
                  onCheckedChange={(v) => updateSettings({ hifzModeEnabled: v })}
                />
              </div>
            </SettingRow>

            <div className="pt-2">
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={() => navigate('/hifz')}
              >
                <Brain className="h-4 w-4" />
                {lang === 'ur' ? 'حفظ ڈیش بورڈ کھولیں' : 'Open Hifz Dashboard'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Audio / Qari */}
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <SectionHeader icon={Volume2} title={lang === 'ur' ? 'آڈیو / قاری' : 'Audio / Reciter'} />
            
            {/* Audio Speed Control */}
            <div className="mb-4 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  {lang === 'ur' ? 'آڈیو رفتار' : 'Playback Speed'}
                </p>
                <span className="text-xs text-primary font-bold ml-auto">{settings.audioSpeed}x</span>
              </div>
              <div className="flex gap-1.5">
                {([0.5, 0.75, 1, 1.25, 1.5] as AudioSpeed[]).map((speed) => (
                  <Button
                    key={speed}
                    variant={settings.audioSpeed === speed ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={() => updateSettings({ audioSpeed: speed })}
                  >
                    {speed}x
                  </Button>
                ))}
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground mb-3">
              {lang === 'ur' ? 'تلاوت کے لیے قاری selected کریں' : 'Select reciter for audio playback'}
            </p>
            <div className="space-y-1.5">
              {QARI_LIST.map((q) => (
                <button
                  key={q.id}
                  className={cn(
                    'w-full flex items-center justify-between p-3 rounded-lg border transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
                    settings.qari === q.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                  onClick={() => updateSettings({ qari: q.id as QariId })}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'flex items-center justify-center h-8 w-8 rounded-full',
                      settings.qari === q.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}>
                      <Volume2 className="h-3.5 w-3.5" />
                    </div>
                    <div className="text-left">
                      <p className={cn('text-sm font-medium', lang === 'ur' && 'font-urdu rtl')}>
                        {lang === 'ur' ? q.nameUr : q.nameEn}
                      </p>
                    </div>
                  </div>
                  {settings.qari === q.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <SectionHeader icon={Shield} title={lang === 'ur' ? 'ڈیٹا مینجمنٹ' : 'Data Management'} />
            
            {user && (
              <Button variant="outline" className="w-full gap-2 mb-3" onClick={handleSync}>
                <CloudUpload className="h-4 w-4" />
                {lang === 'ur' ? 'کلاؤڈ میں محفوظ کریں' : 'Backup to Cloud'}
              </Button>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/5"
                >
                  <Trash2 className="h-4 w-4" />
                  {lang === 'ur' ? 'بک مارکس اور پیش رفت صاف کریں' : 'Clear Bookmarks & Progress'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {lang === 'ur' ? 'ڈیٹا صاف کریں' : 'Clear Data'}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {lang === 'ur' 
                      ? 'کیا آپ واقعی اپنے بک مارکس اور پیش رفت کی معلومات صاف کرنا چاہتے ہیں؟ یہ عمل واپس نہیں کیا جا سکتا۔'
                      : 'Are you sure you want to clear your bookmarks and progress data? This action cannot be undone.'}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {lang === 'ur' ? 'منسوخ کریں' : 'Cancel'}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      const keysToKeep = ['quran-settings', 'quran-lang'];
                      const allKeys = Object.keys(localStorage);
                      allKeys.forEach(key => {
                        if (key.startsWith('quran-') && !keysToKeep.includes(key)) {
                          localStorage.removeItem(key);
                        }
                      });
                      toast({ title: lang === 'ur' ? 'ڈیٹا صاف ہو گیا' : 'Data cleared', duration: 2000 });
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {lang === 'ur' ? 'صاف کریں' : 'Clear'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <SectionHeader icon={Info} title={lang === 'ur' ? 'ایپ کی معلومات' : 'About'} />
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>{lang === 'ur' ? 'ورژن' : 'Version'}</span>
                <span className="font-mono">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span>{lang === 'ur' ? 'ڈیٹا سورس' : 'Data Source'}</span>
                <span>AlQuran Cloud API</span>
              </div>
              <div className="flex justify-between">
                <span>{lang === 'ur' ? 'آڈیو' : 'Audio'}</span>
                <span>Islamic Network CDN</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SettingsPage;
