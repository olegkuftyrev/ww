/**
 * Product conversion data lookup table
 * Maps product numbers to their conversion factors
 */
export const PRODUCT_CONVERSIONS: Record<string, number> = {
  // Meat
  P10002: 40, // Chicken, Orange Dark Battered
  P10028: 40, // Chicken, Teriyaki Thigh Marinated
  P10019: 40, // Chicken, Dark Diced Marinated
  P10027: 40, // Chicken, Breast Strip Battered
  P10008: 40, // Chicken, Breast Sliced Marinated
  P10018: 20, // Chicken, Breast Bites Battered
  P5020: 40, // Beef, Top Sirloin Steak
  P5017: 30, // Beef, BB Strip Breaded
  P5007: 40, // Beef, Sliced Marinated

  // Seafood
  P16032: 20, // Shrimp, Battered Tempura 29/33 K-

  // Produce
  P19149: 32, // Cabbage, K-Minus Shredded
  P19013: 20, // Broccoli
  P19909: 30, // Bell Pepper, Red
  P19055: 40, // Zucchini
  P19048: 50, // Onion, Yellow Fresh
  P19186: 20, // Bean, Green Washed & Trimmed
  P19016: 50, // Cabbage
  P19045: 10, // Mushroom, Fresh
  P19085: 30, // Celery K-
  P19169: 18, // Baby Broccoli
  P19910: 11, // Bell Pepper, Yellow
  P19187: 4, // Onion, Green K-
  P19147: 12, // Kale, Shredded
  P19046: 8, // Onion, Green

  // Grocery
  P1079: 400, // Cookies, Fortune PX
  P1102: 30, // Noodles, (K-) Chow Mein
  P1260: 100, // Rangoon, Cream Cheese K-
  P1112: 50, // Rice, Long Grain
  P1107: 35, // Oil, Salad
  P1001: 200, // Springroll, Veg
  P1004: 60, // Eggroll, Chicken
  P1129: 50, // Sugar
  P1684: 125, // Apple, Crisps Dried
  P19054: 20, // Peas & Carrots
  P1249: 32, // Sauce, Honey Walnut PX
  P2002: 30, // Eggs, Liquid Cage Free
  P1404: 40, // Sauce, Honey
  P1295: 35, // Sauce, Sweet and Sour PX
  P1792: 40, // Sauce, Crispy Shrimp & Beef
  P1580: 40, // Sauce, Stir Fry Black Pepper
  P1116: 4.8, // Sauce, Cooking Basic (K-)
  P1158: 6, // Nuts, Walnut Glazed
  P1272: 50, // Starch, Modified PX
  P19052: 6, // Nuts, Peanuts
  P1093: 12, // Ginger, Garlic Blend
  P1268: 40, // Sauce, Stir Fry PX
  P1131: 4, // Vinegar, White
  P1233: 40, // Sauce, SweetFire PX
  P19002: 20, // Pineapple, Chunk

  // Paper - Beverages
  P25980: 32, // Bev, Dasani Water 16.9 oz
  P25911: 24, // Bev, Coke Classic (Bottled)
  P25973: 24, // Bev, Coke Mexican Glass
  P25959: 24, // Bev, Coke Zero (Bottled)
  P25908: 24, // Bev, Powerade Mountain Berry Blast
  P25341: 24, // Bev, Tea Black WB
  P25353: 50, // Bev, Honest Kids Apple Juice
  P25422: 12, // Bev, Concentrate Peach Lychee Refresher
  P25421: 12, // Bev, Concentrate Watermelon Mango Refresher
  P25424: 12, // Bev, Concentrate Pomegranate Pineapple Refresher
  P25423: 12, // Bev, Concentrate Mango Guava Tea Refresher
  P25004: 5, // Bev, Coke Diet BIB
  P25003: 5, // Bev, Coke Classic BIB
  P25005: 5, // Bev, Dr. Pepper BIB
  P25027: 5, // Bev, Coke Sprite 5G BIB
  P25943: 5, // Bev, Coke Minute Maid Lemonade BIB
  P25346: 5, // Bev, Coke Fanta Strawberry BIB
  P25006: 5, // Bev, Coke Fanta Orange BIB
  P25933: 5, // Bev, Fuze Raspberry BIB
  P25077: 5, // Bev, Coke Cherry BIB
  P25244: 5, // Bev, Coke Barqs Rootbeer BIB
  P25403: 24, // Bev, Sprite Mexican (Glass)

  // Paper - Disposables
  P35432: 7200, // Napkin, Kraft Interfold PX Logo
  P35048: 2000, // Fork, Plastic Black Heavy
  P35719: 200, // Container, PP 3Cmp Hngd PX Logo
  P35213: 2000, // Straw, 8.75" Clear Wrapped
  P35509: 504, // Lid, 20–22 oz Bowl Clear Plastic PX Logo
  P36029: 250, // Bag, Plas Wave 4mil 19x17 PX
  P35508: 504, // Bowl, 20–22 oz Plastic Black PP Square PX
  P35149: 1000, // Cup, 12 oz Paper Kid PX Logo
  P35130: 450, // Pail, 8 oz PX Logo
  P35062: 2000, // Lid, 22 oz Cold Cup PX Logo
  P35580: 3000, // Chopsticks, Bamboo Wrapped PX Logo
  P35275: 1000, // Bag, Glassine 4.75 x 8.25 PX Logo
  P35542: 1500, // Kit, Cutlery PX
  P35040: 1000, // Cup, 22 oz Paper PX Logo
  P35094: 500, // Plate, 9.25" Fiber 3 Compartment PX Logo
  P35406: 1000, // Lid, Flat 12–24 oz
  P35081: 450, // Pail, 26 oz PX Logo
  P35268: 750, // Cup, 30 oz Paper PX Logo
  P35380: 600, // Cup, 24 oz Color Print PET
  P35634: 300, // Pail, Kid Panda Carton
  P35659: 1000, // Container, Fiber 3Comp PFree PX
  P35065: 1000, // Lid, 30–32 oz Cold Cup PX Logo
  P35126: 450, // Pail, 16 oz PX Logo
  P35269: 600, // Cup, 42 oz Paper PX Logo

  // Condiments
  P1124: 1000, // Sauce, Soy Packet PX
  P1151: 700, // Sauce, Chili Packet PX
  P1652: 500, // Sauce, Sweet & Sour Packets PX
  P1566: 311, // Sauce, Teriyaki Sauce Packet PX
  P23001: 500, // Sauce, Mustard Packets PX
}

/**
 * Get conversion factor for a product number
 * @param productNumber - Product number (e.g., "P10002")
 * @param defaultValue - Default value if not found (default: 1)
 * @returns Conversion factor
 */
export function getConversion(productNumber: string, defaultValue = 1): number {
  return PRODUCT_CONVERSIONS[productNumber] ?? defaultValue
}

/**
 * Check if a product has a predefined conversion
 */
export function hasConversion(productNumber: string): boolean {
  return productNumber in PRODUCT_CONVERSIONS
}
