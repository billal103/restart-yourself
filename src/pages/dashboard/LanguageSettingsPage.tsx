import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SettingsTabs } from '@/components/common/SettingsTabs'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'bn', name: 'Bangla', nativeName: 'বাংলা' },
]

export default function LanguageSettingsPage() {
  const { i18n } = useTranslation()

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
      <SettingsTabs />

      <Card className="mt-6">
        <CardContent className="pt-6">
          <h2 className="font-semibold text-text-primary">Display Language</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Navigation and core interface elements are currently available in English and Bangla.
            Full translation of story content and recovery tools is planned for a later milestone.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => void i18n.changeLanguage(lang.code)}
                className={cn(
                  'focus-ring flex items-center justify-between rounded-lg border px-4 py-3 text-left',
                  i18n.language === lang.code
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-surface-muted hover:bg-surface',
                )}
              >
                <span className="text-sm font-medium text-text-primary">
                  {lang.name} <span className="text-text-muted">· {lang.nativeName}</span>
                </span>
                {i18n.language === lang.code && <Check className="size-4 text-primary-600" />}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
