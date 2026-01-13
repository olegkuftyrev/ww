/**
 * Product categorization by product number
 * Used to reorganize products into business-specific categories
 */

export const PRODUCT_CATEGORIES = {
  'WIC': new Set(['P10002', 'P10028', 'P10019', 'P10027', 'P10008', 'P10018']),

  'Seafood': new Set(['P16032']),

  'WIF Beef': new Set(['P5007', 'P5017', 'P5020']),

  'Appetizers': new Set(['P1260', 'P1001', 'P1004']),

  'Sides': new Set(['P1102', 'P1112', 'P2002', 'P19149']),

  'Sauce Cart': new Set([
    'P1093',
    'P1580',
    'P1404',
    'P1233',
    'P1249',
    'P1268',
    'P1107',
    'P1295',
    'P1792',
    'P19002',
  ]),

  'Condements': new Set(['P1652', 'P1566', 'P1151', 'P1124', 'P23001']),

  'Vegetables': new Set([
    'P19013',
    'P19016',
    'P19045',
    'P19048',
    'P19054',
    'P19055',
    'P19085',
    'P19147',
    'P19169',
    'P19186',
    'P19187',
    'P19909',
    'P19910',
  ]),

  'BIBs': new Set([
    'P25003',
    'P25004',
    'P25005',
    'P25006',
    'P25027',
    'P25244',
    'P25346',
    'P25933',
    'P25943',
    'P25077',
  ]),

  'PCB': new Set(['P25421', 'P25422', 'P25423', 'P25424', 'P25343', 'P25341']),

  'Bottles': new Set(['P25908', 'P25911', 'P25973', 'P25980', 'P25959', 'P25417', 'P25403']),

  'FoH Packaging': new Set(['P35081', 'P35126', 'P35130', 'P35509', 'P35508', 'P35719']),

  'Cups & lids': new Set([
    'P35149',
    'P35380',
    'P35268',
    'P35269',
    'P35406',
    'P35062',
    'P35065',
    'P35040',
  ]),

  'Prep Area': new Set(['P1158', 'P19052', 'P1116', 'P1129', 'P1131', 'P1272']),

  'FoH': new Set(['P1079', 'P35048', 'P35213', 'P35432']),

  'Catering': new Set(['P35659', 'P35542']),

  'Cub': new Set(['P25353', 'P1684']),

  'Bags': new Set(['P35522', 'P35275', 'P36029', 'P35521']),
} as const

export type ProductCategory = keyof typeof PRODUCT_CATEGORIES

/**
 * Get the category for a product number
 * @param productNumber Product number to categorize
 * @returns Category name or 'OTHERS' if not found
 */
export function getCategoryForProduct(productNumber: string): ProductCategory | 'OTHERS' {
  for (const [category, products] of Object.entries(PRODUCT_CATEGORIES)) {
    if (products.has(productNumber)) {
      return category as ProductCategory
    }
  }
  return 'OTHERS'
}

/**
 * Get all category names in order
 */
export function getAllCategories(): Array<ProductCategory | 'OTHERS'> {
  return [...Object.keys(PRODUCT_CATEGORIES), 'OTHERS'] as Array<ProductCategory | 'OTHERS'>
}
