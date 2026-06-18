export const NAV_ITEMS = [
  { label: 'Fonctionnalités', href: '#features' },
  { label: 'Tarifs', href: '#pricing' },
  { label: 'Témoignages', href: '#testimonials' },
  { label: 'FAQ', href: '#faq' },
];

export const FEATURES = [
  {
    icon: '📄',
    title: 'Création Rapide',
    description:
      'Générez des factures professionnelles en quelques secondes grâce à nos modèles personnalisables et notre interface intuitive.',
  },
  {
    icon: '📊',
    title: 'Tableau de Bord',
    description:
      'Visualisez vos revenus, factures en attente et statistiques financières en temps réel sur un tableau de bord centralisé.',
  },
  {
    icon: '🔔',
    title: 'Rappels Automatiques',
    description:
      'Envoyez des relances automatiques pour les factures impayées et réduisez vos délais de paiement jusqu\'à 60%.',
  },
  {
    icon: '🔗',
    title: 'Paiement en Ligne',
    description:
      'Intégrez des liens de paiement directement dans vos factures pour encaisser plus vite via carte bancaire ou virement.',
  },
  {
    icon: '🧾',
    title: 'Gestion des Clients',
    description:
      'Centralisez toutes les informations clients, l\'historique des transactions et les devis convertis en factures.',
  },
  {
    icon: '🔒',
    title: 'Sécurité & Conformité',
    description:
      'Données chiffrées, conformité RGPD et archivage légal automatique. Votre comptabilité en sécurité totale.',
  },
  {
    icon: '📤',
    title: 'Export Multi-Format',
    description:
      'Exportez vos factures en PDF, Excel, CSV ou intégrez directement avec votre logiciel comptable (Sage, QuickBooks, FEC).',
  },
  {
    icon: '🌐',
    title: 'Multi-Devises',
    description:
      'Facturer vos clients internationaux dans leur devise locale avec conversion automatique et TVA adaptée.',
  },
];

export const STATS = [
  { value: '50 000+', label: 'Entreprises actives' },
  { value: '2M+', label: 'Factures générées' },
  { value: '98%', label: 'Taux de satisfaction' },
  { value: '€12M+', label: 'Encaissés chaque mois' },
];

export const PRICING_PLANS = [
  {
    name: 'Starter',
    price: '0',
    period: '/ mois',
    description: 'Parfait pour démarrer en solo',
    features: ['5 factures / mois', '1 client', 'Modèles de base', 'Export PDF', 'Support email'],
    highlighted: false,
    cta: 'Commencer gratuitement',
  },
  {
    name: 'Pro',
    price: '29',
    period: '/ mois',
    description: 'Pour les indépendants et TPE',
    features: [
      'Factures illimitées',
      'Clients illimités',
      'Modèles personnalisés',
      'Rappels automatiques',
      'Paiement en ligne',
      'Export comptable',
      'Support prioritaire',
    ],
    highlighted: true,
    cta: 'Essai gratuit 14 jours',
  },
  {
    name: 'Business',
    price: '79',
    period: '/ mois',
    description: 'Pour les PME en croissance',
    features: [
      'Tout du plan Pro',
      'Utilisateurs multiples',
      'Gestion des équipes',
      'API & Webhooks',
      'Multi-sociétés',
      'Comptable invité',
      'Support dédié 24/7',
    ],
    highlighted: false,
    cta: 'Contacter l\'équipe',
  },
];

export const TESTIMONIALS = [
  {
    name: 'Sophie Martin',
    role: 'Directrice Financière',
    company: 'TechVision SAS',
    text: 'FacturePro a transformé notre cycle de facturation. Nous avons réduit nos délais de paiement de 45 jours à moins de 15 jours. L\'interface est tellement intuitive que toute l\'équipe a été formée en une heure.',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?w=80&h=80&fit=crop',
  },
  {
    name: 'Karim Benali',
    role: 'Consultant Indépendant',
    company: 'KBConsulting',
    text: 'En tant que freelance, je perdais des heures chaque semaine sur ma facturation. Maintenant je génère une facture professionnelle en moins de 2 minutes. Le suivi des paiements est devenu un jeu d\'enfant.',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?w=80&h=80&fit=crop',
  },
  {
    name: 'Claire Dubois',
    role: 'Co-fondatrice',
    company: 'Studio Pixel',
    text: 'Les rappels automatiques sont une révolution. Nos clients paient maintenant à temps sans que nous ayons à les relancer manuellement. Notre trésorerie s\'est considérablement améliorée.',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=80&h=80&fit=crop',
  },
];

export const FAQ_ITEMS = [
  {
    question: 'Puis-je essayer FacturePro gratuitement ?',
    answer:
      'Oui, notre plan Starter est gratuit sans limite de durée pour jusqu\'à 5 factures par mois. Le plan Pro offre aussi un essai gratuit de 14 jours sans carte bancaire requise.',
  },
  {
    question: 'Mes données sont-elles sécurisées ?',
    answer:
      'Absolument. Toutes les données sont chiffrées en AES-256, hébergées en France (conformité RGPD), avec des sauvegardes quotidiennes automatiques et un temps de disponibilité garanti à 99.9%.',
  },
  {
    question: 'Puis-je importer mes données existantes ?',
    answer:
      'Oui, vous pouvez importer vos clients et factures depuis Excel, CSV ou depuis d\'autres logiciels de facturation. Notre équipe d\'onboarding vous accompagne gratuitement dans la migration.',
  },
  {
    question: 'Quels formats de sortie sont disponibles ?',
    answer:
      'FacturePro génère des PDF professionnels, des exports Excel et CSV, des exports comptables FEC, et s\'intègre avec Sage, QuickBooks, et Pennylane via notre API REST.',
  },
  {
    question: 'Comment fonctionnent les rappels automatiques ?',
    answer:
      'Vous définissez un calendrier de relances (J+1, J+7, J+30 après échéance) et FacturePro envoie des emails personnalisés à vos clients. Vous gardez le contrôle total sur les templates et la fréquence.',
  },
  {
    question: 'Y a-t-il des frais cachés sur les paiements en ligne ?',
    answer:
      'Non. Nous ne prenons aucune commission sur vos encaissements. Seuls les frais de traitement bancaire standard de Stripe (1.4% + 0.25€ par transaction) s\'appliquent.',
  },
];

export const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Créez votre compte',
    desc: 'Inscrivez-vous en 30 secondes. Importez vos clients et configurez votre profil d\'entreprise.',
    icon: '🚀',
  },
  {
    step: '02',
    title: 'Générez vos factures',
    desc: 'Créez des factures professionnelles depuis vos devis ou de zéro, en quelques clics.',
    icon: '✍️',
  },
  {
    step: '03',
    title: 'Encaissez plus vite',
    desc: 'Envoyez par email avec lien de paiement. Suivez les paiements et relancez automatiquement.',
    icon: '💰',
  },
];
