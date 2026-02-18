import { useLanguage } from '@/contexts/LanguageContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Globe, Moon, Type, FileText } from 'lucide-react';

const SettingsPage = () => {
  const { t, lang, setLang } = useLanguage();
  const { settings, updateSettings } = useSettings();

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-sm">
        <div className="mx-auto max-w-lg px-4 py-3">
          <h1 className="text-xl font-bold text-primary">{t('settings')}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4 space-y-4">
        {/* Language */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t('language')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button
              variant={lang === 'ur' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLang('ur')}
            >
              اردو
            </Button>
            <Button
              variant={lang === 'en' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLang('en')}
            >
              English
            </Button>
          </CardContent>
        </Card>

        {/* Page Format */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t('pageFormat')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button
              variant={settings.pageFormat === '16-line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateSettings({ pageFormat: '16-line' })}
            >
              {t('line16')}
            </Button>
            <Button
              variant={settings.pageFormat === '15-line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateSettings({ pageFormat: '15-line' })}
            >
              {t('line15')}
            </Button>
          </CardContent>
        </Card>

        {/* Font Size */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Type className="h-4 w-4" />
              {t('fontSize')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Slider
              value={[settings.fontSize]}
              onValueChange={([v]) => updateSettings({ fontSize: v })}
              min={18}
              max={42}
              step={2}
            />
            <p className="font-arabic text-center rtl" style={{ fontSize: `${settings.fontSize}px` }}>
              بِسْمِ اللَّهِ
            </p>
          </CardContent>
        </Card>

        {/* Dark Mode */}
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              <Label>{t('darkMode')}</Label>
            </div>
            <Switch
              checked={settings.darkMode}
              onCheckedChange={(v) => updateSettings({ darkMode: v })}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SettingsPage;
