import {
  calculateSimple,
  calculateWithLineDiscount,
  calculateWithGlobalDiscount,
  calculateWithCategoryVAT,
} from './utils/calculations';

const items = [
  { quantite: 2, prix_unitaire: 100, remise: 10, categorie_id: 1 },
  { quantite: 1, prix_unitaire: 50, remise: 0, categorie_id: 2 },
];

test('calcule une facture simple HT + TVA', () => {
  const result = calculateSimple(items);
  expect(result.totalHT).toBe(250);
  expect(result.tva).toBe(50);
  expect(result.totalTTC).toBe(300);
});

test('calcule une remise par ligne', () => {
  const result = calculateWithLineDiscount(items);
  expect(result.totalHT).toBe(230);
  expect(result.tva).toBe(46);
  expect(result.totalTTC).toBe(276);
});

test('calcule une remise globale', () => {
  const result = calculateWithGlobalDiscount(items, 10);
  expect(result.totalHT).toBe(250);
  expect(result.remiseMontant).toBe(25);
  expect(result.totalApresRemise).toBe(225);
  expect(result.tva).toBe(45);
  expect(result.totalTTC).toBe(270);
});

test('calcule la TVA par catégorie', () => {
  const categories = [
    { id: 1, nom: 'Informatique' },
    { id: 2, nom: 'Services' },
  ];
  const result = calculateWithCategoryVAT(items, categories);
  expect(result.totalHT).toBe(250);
  expect(result.tva).toBe(45);
  expect(result.totalTTC).toBe(295);
});
