const DISTRICTS = [
  "Pune",
  "Satara",
  "Sangli",
  "Kolhapur",
  "Solapur",
  "Raigad",
  "Ratnagiri",
  "Sindhudurg",
  "Thane",
  "Palghar",
  "Nashik",
  "Ahilyanagar"
];

const BUSINESS_LAYERS = [
  "Production",
  "Agricultural Inputs",
  "Farm Services",
  "Aggregation & Market Linkage",
  "Post-Harvest & Infrastructure",
  "Processing & Value Addition",
  "Distribution, Retail & Trade",
  "Waste, By-products & Circular Agriculture",
  "Agriculture Finance & Risk"
];

const PRODUCTS = [
  "grapes",
  "onion",
  "mango",
  "cashew",
  "pomegranate",
  "sugarcane",
  "tomato",
  "banana",
  "turmeric",
  "rice",
  "fish",
  "fisheries",
  "dairy",
  "milk",
  "floriculture",
  "vegetables",
  "horticulture",
  "soybean",
  "jaggery"
];

const LAYER_KEYWORDS = {
  "Production": ["production", "area", "yield", "cultivation", "crop", "harvest"],
  "Agricultural Inputs": ["seed", "fertilizer", "input", "nursery", "planting material", "irrigation"],
  "Farm Services": ["extension", "advisory", "mechanization", "custom hiring", "farm service"],
  "Aggregation & Market Linkage": ["aggregation", "farmer producer", "fpo", "market linkage", "procurement", "mandi", "apmc"],
  "Post-Harvest & Infrastructure": ["cold storage", "warehouse", "storage", "pack house", "packhouse", "post harvest", "post-harvest", "logistics", "infrastructure"],
  "Processing & Value Addition": ["processing", "value addition", "processed", "juice", "pulp", "dehydrated", "wine"],
  "Distribution, Retail & Trade": ["retail", "wholesale", "trade", "export", "import", "consumer", "distribution"],
  "Waste, By-products & Circular Agriculture": ["waste", "by-product", "residue", "compost", "biofuel", "circular"],
  "Agriculture Finance & Risk": ["credit", "loan", "insurance", "risk", "finance", "subsidy", "scheme"]
};

const SIGNAL_TYPES = {
  "Demand growth": ["demand", "consumption", "buyer", "requirement", "retail", "procurement"],
  "Supply constraint": ["shortage", "constraint", "deficit", "gap", "insufficient", "low availability"],
  "Price/value opportunity": ["price", "value", "premium", "margin", "realisation", "remunerative"],
  "Procurement demand": ["procurement", "purchase", "tender", "buyer"],
  "Institutional demand": ["institution", "government", "school", "hospital", "mid-day meal"],
  "Processing demand": ["processing", "processor", "processed", "value addition"],
  "Consumption change": ["consumption", "consumer", "diet", "urban"],
  "Import dependence": ["import", "imports", "dependence"],
  "Export trend indicator": ["export", "exports", "apeda", "global"],
  "Post-harvest loss": ["post harvest loss", "post-harvest loss", "losses", "wastage"],
  "Storage/cold-chain gap": ["cold chain", "cold storage", "warehouse", "storage gap"],
  "Infrastructure gap": ["infrastructure", "gap", "facility", "pack house"],
  "Aggregation gap": ["aggregation", "market linkage", "fpo", "apmc"],
  "Distribution gap": ["distribution", "logistics", "supply chain"],
  "Waste/by-product opportunity": ["waste", "by-product", "residue"],
  "Emerging product": ["emerging", "new product", "innovation"],
  "Changing buyer requirement": ["quality", "standard", "traceability", "certification", "certificate", "buyer requirement", "residue monitoring"],
  "Government/industry intervention": ["scheme", "mission", "subsidy", "policy", "intervention"]
};

module.exports = {
  DISTRICTS,
  BUSINESS_LAYERS,
  PRODUCTS,
  LAYER_KEYWORDS,
  SIGNAL_TYPES
};
