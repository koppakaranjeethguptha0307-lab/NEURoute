import React from 'react';
import { Globe } from 'lucide-react';
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
} from '@/utils/i18nAlerts';

interface LanguageSelectorProps {
  currentLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  className?: string;
  showIcon?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onLanguageChange,
  className = '',
  showIcon = true,
}) => {
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 shadow-sm text-xs ${className}`}>
      {showIcon && <Globe className="h-3.5 w-3.5 text-slate-500 shrink-0" />}
      <select
        value={currentLanguage}
        onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
        aria-label="Select alert language"
        className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer text-xs pr-1"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.nativeLabel} ({lang.label})
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
