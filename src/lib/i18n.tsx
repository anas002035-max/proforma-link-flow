import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export const LANGS = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
] as const;

export type LangCode = (typeof LANGS)[number]["code"];

type Dict = Record<string, string>;

const en: Dict = {
  "nav.dashboard": "Dashboard",
  "nav.links": "Smart Links",
  "nav.qr": "QR Codes",
  "nav.bio": "Bio Page",
  "nav.analytics": "Analytics",
  "nav.tools": "Tools",
  "nav.billing": "Billing & Plans",
  "nav.core": "Core tools",
  "nav.utilities": "Utilities",
  "nav.account": "Account",
  "nav.signout": "Sign out",
  "tools.title": "Engineering Tools",
  "tools.subtitle": "Twelve precision utilities that run entirely in your browser.",
  "tools.free": "Free utilities",
  "tools.pro": "Pro utilities",
  "tools.open": "Open tool",
  "tools.locked": "Pro only",
  "tools.upgrade": "Upgrade to Pro",
  "tools.lockedTitle": "This tool is part of Proforma Pro",
  "tools.lockedBody": "Unlock all six advanced engineering utilities, geo-targeting and dynamic QR for $2/month.",
  "tools.back": "All tools",
  "seo.heading": "About this tool",
  "common.copy": "Copy",
  "common.copied": "Copied",
  "common.export": "Export",
  "common.upload": "Upload",
  "common.reset": "Reset",
  "common.language": "Language",
};

// Only the navigation/shell strings are translated; tool bodies stay in English
// technical terminology which is standard for developer tooling.
const overrides: Record<Exclude<LangCode, "en">, Dict> = {
  es: {
    "nav.dashboard": "Panel", "nav.links": "Enlaces inteligentes", "nav.qr": "Códigos QR", "nav.bio": "Página bio",
    "nav.analytics": "Analíticas", "nav.tools": "Herramientas", "nav.billing": "Facturación y planes",
    "nav.core": "Herramientas principales", "nav.utilities": "Utilidades", "nav.account": "Cuenta", "nav.signout": "Cerrar sesión",
    "tools.title": "Herramientas de ingeniería", "tools.subtitle": "Doce utilidades que funcionan íntegramente en tu navegador.",
    "tools.free": "Utilidades gratuitas", "tools.pro": "Utilidades Pro", "tools.open": "Abrir herramienta",
    "tools.locked": "Solo Pro", "tools.upgrade": "Mejorar a Pro", "tools.lockedTitle": "Esta herramienta es parte de Proforma Pro",
    "tools.lockedBody": "Desbloquea las seis utilidades avanzadas por 2 $/mes.", "tools.back": "Todas las herramientas",
    "seo.heading": "Sobre esta herramienta", "common.copy": "Copiar", "common.copied": "Copiado",
    "common.export": "Exportar", "common.upload": "Subir", "common.reset": "Reiniciar", "common.language": "Idioma",
  },
  fr: {
    "nav.dashboard": "Tableau de bord", "nav.links": "Liens intelligents", "nav.qr": "Codes QR", "nav.bio": "Page bio",
    "nav.analytics": "Analytique", "nav.tools": "Outils", "nav.billing": "Facturation et forfaits",
    "nav.core": "Outils principaux", "nav.utilities": "Utilitaires", "nav.account": "Compte", "nav.signout": "Déconnexion",
    "tools.title": "Outils d'ingénierie", "tools.subtitle": "Douze utilitaires exécutés entièrement dans votre navigateur.",
    "tools.free": "Utilitaires gratuits", "tools.pro": "Utilitaires Pro", "tools.open": "Ouvrir l'outil",
    "tools.locked": "Pro uniquement", "tools.upgrade": "Passer à Pro", "tools.lockedTitle": "Cet outil fait partie de Proforma Pro",
    "tools.lockedBody": "Débloquez les six utilitaires avancés pour 2 $/mois.", "tools.back": "Tous les outils",
    "seo.heading": "À propos de cet outil", "common.copy": "Copier", "common.copied": "Copié",
    "common.export": "Exporter", "common.upload": "Téléverser", "common.reset": "Réinitialiser", "common.language": "Langue",
  },
  de: {
    "nav.dashboard": "Übersicht", "nav.links": "Smart Links", "nav.qr": "QR-Codes", "nav.bio": "Bio-Seite",
    "nav.analytics": "Analytics", "nav.tools": "Werkzeuge", "nav.billing": "Abrechnung & Tarife",
    "nav.core": "Kernwerkzeuge", "nav.utilities": "Hilfsmittel", "nav.account": "Konto", "nav.signout": "Abmelden",
    "tools.title": "Engineering-Werkzeuge", "tools.subtitle": "Zwölf Werkzeuge, komplett im Browser ausgeführt.",
    "tools.free": "Kostenlose Werkzeuge", "tools.pro": "Pro-Werkzeuge", "tools.open": "Werkzeug öffnen",
    "tools.locked": "Nur Pro", "tools.upgrade": "Auf Pro upgraden", "tools.lockedTitle": "Dieses Werkzeug gehört zu Proforma Pro",
    "tools.lockedBody": "Schalte alle sechs erweiterten Werkzeuge für 2 $/Monat frei.", "tools.back": "Alle Werkzeuge",
    "seo.heading": "Über dieses Werkzeug", "common.copy": "Kopieren", "common.copied": "Kopiert",
    "common.export": "Exportieren", "common.upload": "Hochladen", "common.reset": "Zurücksetzen", "common.language": "Sprache",
  },
  it: {
    "nav.dashboard": "Cruscotto", "nav.links": "Link intelligenti", "nav.qr": "Codici QR", "nav.bio": "Pagina bio",
    "nav.analytics": "Analisi", "nav.tools": "Strumenti", "nav.billing": "Fatturazione e piani",
    "nav.core": "Strumenti principali", "nav.utilities": "Utilità", "nav.account": "Account", "nav.signout": "Esci",
    "tools.title": "Strumenti di ingegneria", "tools.subtitle": "Dodici utilità eseguite interamente nel browser.",
    "tools.free": "Utilità gratuite", "tools.pro": "Utilità Pro", "tools.open": "Apri strumento",
    "tools.locked": "Solo Pro", "tools.upgrade": "Passa a Pro", "tools.lockedTitle": "Questo strumento fa parte di Proforma Pro",
    "tools.lockedBody": "Sblocca tutte e sei le utilità avanzate a 2 $/mese.", "tools.back": "Tutti gli strumenti",
    "seo.heading": "Informazioni sullo strumento", "common.copy": "Copia", "common.copied": "Copiato",
    "common.export": "Esporta", "common.upload": "Carica", "common.reset": "Reimposta", "common.language": "Lingua",
  },
  pt: {
    "nav.dashboard": "Painel", "nav.links": "Links inteligentes", "nav.qr": "Códigos QR", "nav.bio": "Página bio",
    "nav.analytics": "Análises", "nav.tools": "Ferramentas", "nav.billing": "Faturação e planos",
    "nav.core": "Ferramentas principais", "nav.utilities": "Utilitários", "nav.account": "Conta", "nav.signout": "Sair",
    "tools.title": "Ferramentas de engenharia", "tools.subtitle": "Doze utilitários executados inteiramente no navegador.",
    "tools.free": "Utilitários gratuitos", "tools.pro": "Utilitários Pro", "tools.open": "Abrir ferramenta",
    "tools.locked": "Apenas Pro", "tools.upgrade": "Mudar para Pro", "tools.lockedTitle": "Esta ferramenta faz parte do Proforma Pro",
    "tools.lockedBody": "Desbloqueie os seis utilitários avançados por 2 $/mês.", "tools.back": "Todas as ferramentas",
    "seo.heading": "Sobre esta ferramenta", "common.copy": "Copiar", "common.copied": "Copiado",
    "common.export": "Exportar", "common.upload": "Carregar", "common.reset": "Repor", "common.language": "Idioma",
  },
  ja: {
    "nav.dashboard": "ダッシュボード", "nav.links": "スマートリンク", "nav.qr": "QRコード", "nav.bio": "バイオページ",
    "nav.analytics": "分析", "nav.tools": "ツール", "nav.billing": "請求とプラン",
    "nav.core": "コアツール", "nav.utilities": "ユーティリティ", "nav.account": "アカウント", "nav.signout": "サインアウト",
    "tools.title": "エンジニアリングツール", "tools.subtitle": "すべてブラウザ内で動作する12のツール。",
    "tools.free": "無料ツール", "tools.pro": "Proツール", "tools.open": "ツールを開く",
    "tools.locked": "Pro限定", "tools.upgrade": "Proにアップグレード", "tools.lockedTitle": "このツールはProforma Proの機能です",
    "tools.lockedBody": "月額2ドルで6つの高度なツールをすべて解放。", "tools.back": "すべてのツール",
    "seo.heading": "このツールについて", "common.copy": "コピー", "common.copied": "コピーしました",
    "common.export": "エクスポート", "common.upload": "アップロード", "common.reset": "リセット", "common.language": "言語",
  },
  zh: {
    "nav.dashboard": "仪表板", "nav.links": "智能链接", "nav.qr": "二维码", "nav.bio": "个人主页",
    "nav.analytics": "分析", "nav.tools": "工具", "nav.billing": "账单与套餐",
    "nav.core": "核心工具", "nav.utilities": "实用工具", "nav.account": "账户", "nav.signout": "退出登录",
    "tools.title": "工程工具", "tools.subtitle": "十二款完全在浏览器中运行的工具。",
    "tools.free": "免费工具", "tools.pro": "专业工具", "tools.open": "打开工具",
    "tools.locked": "仅限专业版", "tools.upgrade": "升级到专业版", "tools.lockedTitle": "该工具属于 Proforma Pro",
    "tools.lockedBody": "每月 2 美元解锁全部六款高级工具。", "tools.back": "所有工具",
    "seo.heading": "关于此工具", "common.copy": "复制", "common.copied": "已复制",
    "common.export": "导出", "common.upload": "上传", "common.reset": "重置", "common.language": "语言",
  },
};

const I18nContext = createContext<{ lang: LangCode; setLang: (l: LangCode) => void; t: (k: string) => string }>({
  lang: "en",
  setLang: () => {},
  t: (k) => en[k] ?? k,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("en");

  useEffect(() => {
    const stored = localStorage.getItem("ph-lang") as LangCode | null;
    if (stored && LANGS.some((l) => l.code === stored)) setLangState(stored);
  }, []);

  const value = useMemo(() => {
    const dict = lang === "en" ? en : { ...en, ...overrides[lang] };
    return {
      lang,
      setLang: (l: LangCode) => {
        setLangState(l);
        if (typeof window !== "undefined") localStorage.setItem("ph-lang", l);
        if (typeof document !== "undefined") document.documentElement.lang = l;
      },
      t: (k: string) => dict[k] ?? k,
    };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
