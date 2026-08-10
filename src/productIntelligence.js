const PRODUCT_INTELLIGENCE = [
  {
    id: "grapes",
    product: "Grapes",
    districts: ["Nashik", "Sangli", "Solapur", "Pune", "Ahilyanagar"],
    institutionAnchors: [
      "APEDA",
      "National Research Centre for Grapes",
      "Maharashtra State Agricultural Marketing Board",
      "National Horticulture Board"
    ],
    rawForms: ["Fresh table grapes", "Export-grade grapes", "Domestic-grade grapes"],
    processedForms: ["Raisins", "Grape juice", "Wine", "Vinegar", "Concentrate"],
    intermediateIndustrialForms: ["Grape seed oil", "Grape pomace extract", "Natural antioxidants", "Nutraceutical ingredients"],
    byproducts: ["Pomace", "Seeds", "Stems", "Rejected berries"],
    buyerCategories: ["Retail chains", "Fruit exporters", "Raisin processors", "Wineries", "Juice processors", "Food ingredient buyers"],
    infrastructureNeeds: ["Pre-cooling", "Cold chain", "Packhouses", "Residue testing", "Sorting/grading", "Reefer logistics"],
    sourceIds: ["apeda-grapes", "apeda-active-packhouses", "nhb", "msamb"]
  },
  {
    id: "onion",
    product: "Onion",
    districts: ["Nashik", "Pune", "Solapur", "Ahilyanagar"],
    institutionAnchors: [
      "National Horticulture Board",
      "AGMARKNET",
      "Maharashtra State Agricultural Marketing Board",
      "NHRDF"
    ],
    rawForms: ["Fresh onion", "Stored onion", "Graded onion"],
    processedForms: ["Dehydrated onion flakes", "Onion powder", "Onion paste", "Fried onion"],
    intermediateIndustrialForms: ["Seasoning ingredient", "Food-service base ingredient", "Ready-to-cook ingredient"],
    byproducts: ["Peels", "Reject bulbs", "Trim waste"],
    buyerCategories: ["APMC traders", "Food processors", "HoReCa kitchens", "Retail chains", "Exporters", "Institutional kitchens"],
    infrastructureNeeds: ["Scientific storage", "Drying/dehydration", "Sorting/grading", "Packaging", "Market linkage"],
    sourceIds: ["agmarknet", "nhb", "msamb"]
  },
  {
    id: "mango",
    product: "Mango",
    districts: ["Ratnagiri", "Sindhudurg", "Raigad", "Pune"],
    institutionAnchors: [
      "APEDA",
      "Dr. Balasaheb Sawant Konkan Krishi Vidyapeeth",
      "National Horticulture Board",
      "MoFPI"
    ],
    rawForms: ["Fresh mango", "Alphonso mango", "Table mango", "Processing-grade mango"],
    processedForms: ["Mango pulp", "Puree", "Frozen cubes", "Dried mango", "Pickle", "Beverages"],
    intermediateIndustrialForms: ["Fruit preparation", "Flavor base", "Baby-food ingredient", "Confectionery ingredient"],
    byproducts: ["Peel", "Seed kernel", "Rejected fruit", "Pomace"],
    buyerCategories: ["Pulp processors", "Beverage companies", "Frozen food companies", "Retail chains", "Exporters", "HoReCa"],
    infrastructureNeeds: ["Ripening chambers", "Pulping units", "Cold chain", "Sorting/grading", "Packhouses", "Waste processing"],
    sourceIds: ["apeda-mango", "apeda-maharashtra-gi", "nhb", "msamb"]
  },
  {
    id: "pomegranate",
    product: "Pomegranate",
    districts: ["Solapur", "Sangli", "Pune", "Nashik", "Ahilyanagar"],
    institutionAnchors: [
      "National Research Centre on Pomegranate",
      "APEDA",
      "National Horticulture Board",
      "Maharashtra State Agricultural Marketing Board"
    ],
    rawForms: ["Fresh pomegranate", "Export-grade fruit", "Domestic-grade fruit"],
    processedForms: ["Arils", "Juice", "Concentrate", "Molasses", "Ready-to-eat packs"],
    intermediateIndustrialForms: ["Peel extract", "Natural antioxidant ingredient", "Nutraceutical ingredient"],
    byproducts: ["Peel", "Seeds", "Cracked fruit", "Rejected fruit"],
    buyerCategories: ["Fresh fruit exporters", "Retail chains", "Juice processors", "Nutraceutical companies", "Fresh-cut processors"],
    infrastructureNeeds: ["Aril extraction", "Cold chain", "Packhouses", "Residue testing", "Sorting/grading"],
    sourceIds: ["apeda-active-packhouses", "nhb", "msamb"]
  },
  {
    id: "sugarcane",
    product: "Sugarcane",
    districts: ["Kolhapur", "Sangli", "Satara", "Solapur", "Pune", "Ahilyanagar"],
    institutionAnchors: [
      "Vasantdada Sugar Institute",
      "Maharashtra Sugar Commissionerate",
      "NABARD",
      "MoFPI"
    ],
    rawForms: ["Sugarcane"],
    processedForms: ["Sugar", "Jaggery", "Khandasari", "Ethanol", "Molasses"],
    intermediateIndustrialForms: ["Bio-CNG feedstock", "Bagasse-based power", "Press-mud compost", "Industrial alcohol"],
    byproducts: ["Bagasse", "Molasses", "Press mud", "Trash"],
    buyerCategories: ["Sugar mills", "Jaggery units", "Distilleries", "Bioenergy companies", "Cattle-feed or compost producers"],
    infrastructureNeeds: ["Crushing", "Jaggery processing", "Distillery capacity", "Bioenergy systems", "Logistics"],
    sourceIds: ["nabard-maharashtra", "msamb", "ncdc"]
  },
  {
    id: "cashew",
    product: "Cashew",
    districts: ["Ratnagiri", "Sindhudurg", "Raigad", "Kolhapur"],
    institutionAnchors: [
      "Directorate of Cashew Research",
      "Dr. Balasaheb Sawant Konkan Krishi Vidyapeeth",
      "APEDA",
      "National Horticulture Board"
    ],
    rawForms: ["Raw cashew nut", "Cashew apple"],
    processedForms: ["Cashew kernels", "Roasted cashew", "Cashew apple juice", "Cashew feni-style fermented products"],
    intermediateIndustrialForms: ["Cashew nut shell liquid", "Food ingredient", "Confectionery ingredient"],
    byproducts: ["Cashew shell", "Cashew apple", "Cashew testa"],
    buyerCategories: ["Kernel processors", "Snack brands", "Confectionery companies", "CNSL users", "Local processors"],
    infrastructureNeeds: ["Drying", "Shelling", "Peeling", "Grading", "Packaging", "Cashew apple processing"],
    sourceIds: ["nhb", "msamb"]
  }
];

function getProductIntelligence() {
  return PRODUCT_INTELLIGENCE;
}

module.exports = {
  PRODUCT_INTELLIGENCE,
  getProductIntelligence
};
