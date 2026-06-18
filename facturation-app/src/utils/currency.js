/** Devises supportées (cahier des charges — multi-devise). */
export const CURRENCIES = [
  { code: 'MAD', label: 'Dirham marocain', symbol: 'DH', locale: 'fr-MA' },
  { code: 'EUR', label: 'Euro', symbol: '€', locale: 'fr-FR' },
  { code: 'USD', label: 'Dollar US', symbol: '$', locale: 'en-US' },
  { code: 'GBP', label: 'Livre sterling', symbol: '£', locale: 'en-GB' },
];

export const DEFAULT_CURRENCY = 'MAD';

/** Devise de référence du catalogue articles (prix_unitaire). */
export const CATALOG_CURRENCY = 'MAD';

/** Taux indicatifs vers MAD (snapshot à la création de facture). */
export const EXCHANGE_RATES_TO_MAD = {
  MAD: 1,
  EUR: 10.85,
  USD: 10.0,
  GBP: 12.5,
};

export const normalizeCurrency = (code) => {
  const c = String(code || DEFAULT_CURRENCY).toUpperCase();
  return CURRENCIES.some((x) => x.code === c) ? c : DEFAULT_CURRENCY;
};

export const getCurrencyMeta = (code) =>
  CURRENCIES.find((c) => c.code === normalizeCurrency(code)) || CURRENCIES[0];

export const getExchangeRateToMad = (code) => {
  const c = normalizeCurrency(code);
  return EXCHANGE_RATES_TO_MAD[c] ?? 1;
};

/** Convertit un montant MAD vers une autre devise. */
export const convertFromMad = (amountMad, currencyCode, customRate = null) => {
  const c = normalizeCurrency(currencyCode);
  const n = Number(amountMad) || 0;
  if (c === 'MAD') return Math.round(n * 100) / 100;
  const rate = customRate != null ? Number(customRate) : getExchangeRateToMad(c);
  return Math.round((n / rate) * 100) / 100;
};

/** Convertit entre deux devises (via MAD). */
export const convertBetweenCurrencies = (amount, fromCurrency, toCurrency) => {
  const from = normalizeCurrency(fromCurrency);
  const to = normalizeCurrency(toCurrency);
  const n = Number(amount) || 0;
  if (from === to) return Math.round(n * 100) / 100;
  return convertFromMad(convertToMad(n, from), to);
};

/** Prix catalogue (MAD) → devise de la facture. */
export const catalogPriceToInvoice = (catalogPrice, invoiceCurrency) =>
  convertFromMad(catalogPrice, invoiceCurrency);

/** Convertit un montant vers MAD. */
export const convertToMad = (amount, currencyCode, customRate = null) => {
  const n = Number(amount) || 0;
  const rate = customRate != null ? Number(customRate) : getExchangeRateToMad(currencyCode);
  return Math.round(n * rate * 100) / 100;
};

/** Montant MAD pour stats (utilise le snapshot enregistré sur la facture). */
export const getInvoiceAmountMad = (facture, field = 'total_ttc') => {
  const madKey = `${field}_mad`;
  if (facture?.[madKey] != null && facture[madKey] !== '') {
    return Number(facture[madKey]) || 0;
  }
  return convertToMad(facture?.[field], facture?.currency, facture?.exchange_rate_to_mad);
};

/** Formate un montant avec la devise de la facture. */
export const formatMoney = (amount, currencyCode = DEFAULT_CURRENCY) => {
  const meta = getCurrencyMeta(currencyCode);
  const n = Number(amount) || 0;
  const formatted = n.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (meta.code === 'MAD') return `${formatted} DH`;
  if (meta.symbol === '€') return `${formatted} €`;
  if (meta.symbol === '$') return `${formatted} $`;
  if (meta.symbol === '£') return `${formatted} £`;
  return `${formatted} ${meta.code}`;
};

/** Enrichit une facture avec devise + équivalents MAD (à l'enregistrement). */
export const enrichInvoiceCurrency = (invoice, currencyCode) => {
  const currency = normalizeCurrency(currencyCode || invoice?.currency);
  const exchange_rate_to_mad = getExchangeRateToMad(currency);
  return {
    ...invoice,
    currency,
    exchange_rate_to_mad,
    total_ht_mad: convertToMad(invoice.total_ht, currency, exchange_rate_to_mad),
    tva_mad: convertToMad(invoice.tva, currency, exchange_rate_to_mad),
    total_ttc_mad: convertToMad(invoice.total_ttc, currency, exchange_rate_to_mad),
  };
};
