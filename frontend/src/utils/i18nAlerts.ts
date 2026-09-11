/**
 * NEURoute — Multilingual Operational Alerts Localization System
 * Problem Statement: SIH26002 — AI-Based Smart Logistics & Accessibility Intelligence Platform for NER
 * 
 * Supports: English (en), Hindi (hi), Assamese (as), Bengali (bn)
 * Provides structured, extensible translation for operational alerts, emergency dispatches,
 * and high-priority logistics disruption warnings across the North Eastern Region.
 */

export type SupportedLanguage = 'en' | 'hi' | 'as' | 'bn';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', flag: '🇮🇳' },
  { code: 'as', label: 'Assamese', nativeLabel: 'অসমীয়া', flag: '🇮🇳' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা', flag: '🇮🇳' },
];

export const UI_TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    alertsTitle: 'Operational Alerts & Notifications',
    emergencyNotice: 'Emergency Logistics Mode Active',
    viewDetails: 'View Clearance Details',
    markAllRead: 'Mark all as read',
    allTab: 'All Alerts',
    unreadTab: 'Unread Only',
    regionalHazard: 'Regional Hazard Alert',
    filterSeverity: 'Severity',
    filterCategory: 'Category',
    criticalPriority: 'Critical Priority',
    rerouteRecommended: 'Alternate route recommended',
    safeCorridorActive: 'Safe relief corridor active',
    disruptionDetected: 'Road blockage detected. Alternate route recommended.',
  },
  hi: {
    alertsTitle: 'परिचालन चेतावनियां और सूचनाएं',
    emergencyNotice: 'आपातकालीन रसद मोड सक्रिय',
    viewDetails: 'निकासी विवरण देखें',
    markAllRead: 'सभी को पढ़ा हुआ चिह्नित करें',
    allTab: 'सभी अलर्ट',
    unreadTab: 'केवल अपठित',
    regionalHazard: 'क्षेत्रीय खतरा चेतावनी',
    filterSeverity: 'गंभीरता',
    filterCategory: 'श्रेणी',
    criticalPriority: 'महत्वपूर्ण प्राथमिकता',
    rerouteRecommended: 'वैकल्पिक मार्ग की अनुशंसा की गई है',
    safeCorridorActive: 'सुरक्षित राहत गलियारा सक्रिय',
    disruptionDetected: 'सड़क अवरोध का पता चला। वैकल्पिक मार्ग की अनुशंसा की गई है।',
  },
  as: {
    alertsTitle: 'কাৰ্যকৰী সতৰ্কবাৰ্তা আৰু জাননী',
    emergencyNotice: 'জৰুৰীকালীন লজিষ্টিক ম’ড সক্ৰিয়',
    viewDetails: 'পৰিষ্কাৰকৰণৰ বিৱৰণ চাওক',
    markAllRead: 'সকলো পঢ়া বুলি চিহ্নিত কৰক',
    allTab: 'সকলো সতৰ্কবাৰ্তা',
    unreadTab: 'নপঢ়া সতৰ্কবাৰ্তা',
    regionalHazard: 'আঞ্চলিক সংকট সতৰ্কবাৰ্তা',
    filterSeverity: 'তীব্ৰতা',
    filterCategory: 'শ্ৰেণী',
    criticalPriority: 'গুৰুত্বপূৰ্ণ অগ্ৰাধিকাৰ',
    rerouteRecommended: 'বিকল্প পথৰ পৰামৰ্শ দিয়া হৈছে',
    safeCorridorActive: 'সুৰক্ষিত সাহায্য কৰিডৰ সক্ৰিয়',
    disruptionDetected: 'পথ অৱৰোধ ধৰা পৰিছে। বিকল্প পথৰ পৰামৰ্শ দিয়া হৈছে।',
  },
  bn: {
    alertsTitle: 'অপারেশনাল সতর্কতা ও নোটিফিকেশন',
    emergencyNotice: 'জরুরি লজিস্টিক মোড সক্রিয়',
    viewDetails: 'ছাড়পত্রের বিবরণ দেখুন',
    markAllRead: 'সবগুলি পঠিত হিসাবে চিহ্নিত করুন',
    allTab: 'সমস্ত সতর্কতা',
    unreadTab: 'শুধুমাত্র অপঠিত',
    regionalHazard: 'আঞ্চলিক বিপদ সতর্কতা',
    filterSeverity: 'তীব্রতা',
    filterCategory: 'বিভাগ',
    criticalPriority: 'জরুরি অগ্রাধিকার',
    rerouteRecommended: 'বিকল্প রুটের সুপারিশ করা হয়েছে',
    safeCorridorActive: 'নিরাপদ ত্রাণ করিডোর সক্রিয়',
    disruptionDetected: 'রাস্তা অবরোধ সনাক্ত হয়েছে। বিকল্প রুটের সুপারিশ করা হয়েছে।',
  },
};

// Known alert pattern translations
interface AlertTranslationRecord {
  title: Record<SupportedLanguage, string>;
  message: Record<SupportedLanguage, string>;
}

const ALERT_DICTIONARY: AlertTranslationRecord[] = [
  {
    title: {
      en: 'Road blockage detected. Alternate route recommended.',
      hi: 'सड़क अवरोध का पता चला। वैकल्पिक मार्ग की अनुशंसा की गई है।',
      as: 'পথ অৱৰোধ ধৰা পৰিছে। বিকল্প পথৰ পৰামৰ্শ দিয়া হৈছে।',
      bn: 'রাস্তা অবরোধ সনাক্ত হয়েছে। বিকল্প রুটের সুপারিশ করা হয়েছে।',
    },
    message: {
      en: 'Massive landslide blocking highway. Alternate corridor recommended.',
      hi: 'राजमार्ग पर भारी भूस्खलन। वैकल्पिक गलियारे की अनुशंसा की गई है।',
      as: 'ৰাষ্ট্ৰীয় ঘাইপথত প্ৰচণ্ড ভূমিস্খলন। বিকল্প সুৰক্ষিত কৰিডৰৰ পৰামৰ্শ দিয়া হৈছে।',
      bn: 'মহাসড়কে মারাত্মক ভূমিধস। বিকল্প নিরাপদ করিডোরের সুপারিশ করা হয়েছে।',
    },
  },
  {
    title: {
      en: 'Major Landslide on NH-06 Sonapur Tunnel',
      hi: 'NH-06 सोनापुर सुरंग पर बड़ा भूस्खलन',
      as: 'সোণাপুৰ সুৰংগৰ ওচৰত NH-06 ত ডাঙৰ ভূমিস্খলন',
      bn: 'NH-06 সোনাপুর টানেলের কাছে বড় ভূমিধস',
    },
    message: {
      en: 'NH-06 is completely blocked near Sonapur Tunnel. Umrangso alternate route recommended.',
      hi: 'सोनापुर सुरंग के पास NH-06 पूरी तरह अवरुद्ध है। उमरांगसो वैकल्पिक मार्ग की अनुशंसा की गई है।',
      as: 'সোণাপুৰ সুৰংগৰ ওচৰত NH-06 সম্পূৰ্ণৰূপে বন্ধ হৈ আছে। উমৰাংচো বিকল্প পথ ব্যৱহাৰ কৰক।',
      bn: 'সোনাপুর টানেলের কাছে NH-06 সম্পূর্ণ অবরুদ্ধ। উমরাংসো বিকল্প রুট ব্যবহারের পরামর্শ দেওয়া হচ্ছে।',
    },
  },
  {
    title: {
      en: 'Flood Alert: Kaziranga Corridor (NH-715)',
      hi: 'बाढ़ की चेतावनी: काजीरंगा गलियारा (NH-715)',
      as: 'বান সতৰ্কতা: কাজিৰঙা কৰিডৰ (NH-715)',
      bn: 'বন্যা সতর্কতা: কাজিরাঙ্গা করিডোর (NH-715)',
    },
    message: {
      en: 'Severe waterlogging between Kohora and Bagori. Speed reduced to 20 km/h.',
      hi: 'कोहोरा और बागोरी के बीच भारी जलभराव। गति सीमा घटाकर 20 किमी/घंटा की गई।',
      as: 'কঁহৰা আৰু বাগৰিৰ মাজত প্ৰচণ্ড পানী জমা হৈছে। গতি ২০ কিমি/ঘণ্টালৈ হ্ৰাস কৰা হৈছে।',
      bn: 'কোহরা এবং বাগরির মাঝে তীব্র জলমগ্নতা। গতিসীমা কমিয়ে ২০ কিমি/ঘণ্টা করা হয়েছে।',
    },
  },
  {
    title: {
      en: 'Severe Weather Warning: Dima Hasao',
      hi: 'गंभीर मौसम चेतावनी: दीमा हसाओ',
      as: 'জটিল বতৰৰ সতৰ্কবাৰ্তা: ডিমা হাচাও',
      bn: 'প্রতিকূল আবহাওয়ার সতর্কতা: ডিমা হাসাও',
    },
    message: {
      en: 'Torrential rainfall predicted exceeding 95mm. High landslide probability.',
      hi: '95 मिमी से अधिक मूसलाधार बारिश का अनुमान। भूस्खलन की अत्यधिक संभावना।',
      as: '৯৫ মিমিৰো অধিক ধাৰাসাৰ বৰষুণৰ সম্ভাৱনা। ভূমিস্খলনৰ তীব্ৰ আশংকা।',
      bn: '৯৫ মিমি-র বেশি প্রবল বৃষ্টির পূর্বাভাস। ভূমিধসের ব্যাপক সম্ভাবনা।',
    },
  },
  {
    title: {
      en: 'Critical Medical Supply Vehicle Delayed',
      hi: 'महत्वपूर्ण चिकित्सा आपूर्ति वाहन में देरी',
      as: 'গুৰুত্বপূৰ্ণ চিকিৎসা সামগ্ৰীৰ বাহন পলম হৈছে',
      bn: 'জরুরি চিকিৎসা সামগ্রী বহনকারী যানবাহন বিলম্বিত',
    },
    message: {
      en: 'Vehicle TRK-NER-01 carrying temperature-sensitive insulin delayed by 45 mins. Dynamic reroute engaged.',
      hi: 'तापमान-संवेदनशील इंसुलिन ले जा रहा वाहन TRK-NER-01 45 मिनट देरी से है। स्वचालित नया मार्ग तय किया गया।',
      as: 'ইনচুলিন কঢ়িয়াই অনা TRK-NER-01 বাহনখন ৪৫ মিনিট পলম হৈছে। স্বয়ংক্ৰিয়ভাৱে নতুন পথ সক্ৰিয় কৰা হৈছে।',
      bn: 'ইনসুলিন বহনকারী TRK-NER-01 গাড়িটি ৪৫ মিনিট দেরিতে চলছে। নতুন নিরাপদ রুটে পুনঃনির্দেশিত করা হয়েছে।',
    },
  },
  {
    title: {
      en: 'Emergency Corridor Cleared: Umrangso Bypass',
      hi: 'आपातकालीन गलियारा साफ: उमरांगसो बाईपास',
      as: 'জৰুৰীকালীন কৰিডৰ মুকলি: উমৰাংচো বাইপাছ',
      bn: 'জরুরি করিডোর উন্মুক্ত: উমরাংসো বাইপাস',
    },
    message: {
      en: 'Priority relief lifeline corridor through Umrangso valley is operational and open for heavy convoys.',
      hi: 'उमरांगसो घाटी से होकर गुजरने वाला प्राथमिकता राहत गलियारा भारी वाहनों के लिए खुला और चालू है।',
      as: 'উমৰাংচো উপত্যকাৰ মাজেৰে যোৱা অগ্ৰাধিকাৰ সাহায্য কৰিডৰটো গধুৰ বাহনৰ বাবে সুচাৰুৰূপে চলি আছে।',
      bn: 'উমরাংসো উপত্যকার মধ্য দিয়ে জরুরি ত্রাণ করিডোরটি ভারী গাড়ির চলাচলের জন্য উন্মুক্ত ও সচল রয়েছে।',
    },
  },
];

const LANGUAGE_STORAGE_KEY = 'neuroute_alert_language';

export function getSelectedAlertLanguage(): SupportedLanguage {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && (saved === 'en' || saved === 'hi' || saved === 'as' || saved === 'bn')) {
      return saved as SupportedLanguage;
    }
  } catch {
    // fallback
  }
  return 'en';
}

export function setSelectedAlertLanguage(lang: SupportedLanguage): void {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // ignore
  }
}

/**
 * Localize an operational alert title and message based on the target language.
 */
export function localizeAlert(
  title: string,
  message: string,
  lang: SupportedLanguage
): { title: string; message: string } {
  if (lang === 'en') {
    return { title, message };
  }

  // Exact or fuzzy match against known operational alert dictionary
  for (const item of ALERT_DICTIONARY) {
    if (
      title.toLowerCase().includes(item.title.en.toLowerCase().substring(0, 20)) ||
      item.title.en.toLowerCase().includes(title.toLowerCase().substring(0, 20))
    ) {
      return {
        title: item.title[lang] || title,
        message: item.message[lang] || message,
      };
    }
  }

  // Generic keyword-driven localization fallback
  if (title.toLowerCase().includes('landslide') || message.toLowerCase().includes('landslide')) {
    const isSonapur = title.toLowerCase().includes('sonapur') || message.toLowerCase().includes('sonapur');
    if (isSonapur) {
      return {
        title: ALERT_DICTIONARY[1].title[lang],
        message: ALERT_DICTIONARY[1].message[lang],
      };
    }
    return {
      title: ALERT_DICTIONARY[0].title[lang],
      message: ALERT_DICTIONARY[0].message[lang],
    };
  }

  if (title.toLowerCase().includes('flood') || message.toLowerCase().includes('flood')) {
    return {
      title: ALERT_DICTIONARY[2].title[lang],
      message: ALERT_DICTIONARY[2].message[lang],
    };
  }

  if (title.toLowerCase().includes('weather') || message.toLowerCase().includes('rain')) {
    return {
      title: ALERT_DICTIONARY[3].title[lang],
      message: ALERT_DICTIONARY[3].message[lang],
    };
  }

  if (title.toLowerCase().includes('medical') || message.toLowerCase().includes('insulin') || message.toLowerCase().includes('pharma')) {
    return {
      title: ALERT_DICTIONARY[4].title[lang],
      message: ALERT_DICTIONARY[4].message[lang],
    };
  }

  return { title, message };
}
