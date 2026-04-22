// Méthode 1: Simple HT + TVA
export const calculateSimple = (items, tvaRate = 0.20) => {
  const totalHT = items.reduce((sum, item) => sum + (item.quantite * item.prix_unitaire), 0);
  const tva = totalHT * tvaRate;
  const totalTTC = totalHT + tva;
  return { totalHT, tva, totalTTC };
};

// Méthode 2: Remise par ligne
export const calculateWithLineDiscount = (items) => {
  let totalHT = 0;
  const itemsWithDiscount = items.map(item => {
    const sousTotal = item.quantite * item.prix_unitaire;
    const remiseMontant = sousTotal * (item.remise / 100);
    const totalLigne = sousTotal - remiseMontant;
    totalHT += totalLigne;
    return { ...item, sousTotal, remiseMontant, totalLigne };
  });
  const tva = totalHT * 0.20;
  const totalTTC = totalHT + tva;
  return { itemsWithDiscount, totalHT, tva, totalTTC };
};

// Méthode 3: Remise globale
export const calculateWithGlobalDiscount = (items, globalDiscount = 0) => {
  const totalHT = items.reduce((sum, item) => sum + (item.quantite * item.prix_unitaire), 0);
  const remiseMontant = totalHT * (globalDiscount / 100);
  const totalApresRemise = totalHT - remiseMontant;
  const tva = totalApresRemise * 0.20;
  const totalTTC = totalApresRemise + tva;
  return { totalHT, remiseMontant, totalApresRemise, tva, totalTTC };
};

// Méthode 4: TVA par catégorie
export const calculateWithCategoryVAT = (items, categories) => {
  const vatRates = {
    'Informatique': 0.20,
    'Services': 0.10,
    'Formation': 0.00
  };
  
  let totalHT = 0;
  let totalTTC = 0;
  
  items.forEach(item => {
    const category = categories.find(c => c.id === item.categorie_id);
    const vatRate = vatRates[category?.nom] || 0.20;
    const montantHT = item.quantite * item.prix_unitaire;
    const tva = montantHT * vatRate;
    
    totalHT += montantHT;
    totalTTC += montantHT + tva;
  });
  
  return { totalHT, totalTTC, tva: totalTTC - totalHT };
};