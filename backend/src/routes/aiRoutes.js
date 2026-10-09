const express = require('express');
const router = express.Router();
const { parseBuyerPrompt } = require('../services/aiService');
const { searchWebProducts } = require('../services/webSearchService');
const Product = require('../models/Product');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// POST /api/ai/analyze-procurement
router.post('/analyze-procurement', async (req, res) => {
  try {
    const { promptText, prompt_text } = req.body;
    const textToAnalyze = promptText || prompt_text;

    if (!textToAnalyze || !textToAnalyze.trim()) {
      return res.status(400).json({ error: 'Prompt text is required for AI analysis' });
    }

    // 1. Natural Language Requirement Extraction via LLM / AI Service
    console.log(`\n===================================================`);
    console.log(`📥 [API DIAGNOSTIC] POST /api/ai/analyze-procurement endpoint called`);
    console.log(`   Prompt Text: "${textToAnalyze.trim()}"`);

    const analysis = await parseBuyerPrompt(textToAnalyze.trim());

    console.log(`   AI Engine Used: ${analysis.ai_engine}`);
    console.log(`   Is AI Parsed: ${analysis.is_ai_parsed}`);
    console.log(`   Extracted Items:`, JSON.stringify(analysis.items));
    console.log(`   Extracted Budget: ₹${analysis.total_budget}`);
    console.log(`   Extracted Deadline: ${analysis.deadline_days} days`);
    console.log(`===================================================\n`);

    // 2. Deterministic Backend Budget Check & Feasibility Validation
    const reqItems = analysis.items || [];
    let calculatedEstTotal = 0;
    
    // 3. Search Real MongoDB Database for matching DealPilot products & suppliers
    const itemNames = reqItems.map(i => i.item_name.toLowerCase());
    const regexQueries = itemNames.map(name => new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));

    let matchedProducts = [];
    if (regexQueries.length > 0) {
      matchedProducts = await Product.find({
        active: true,
        $or: regexQueries.map(r => ({ name: r }))
      })
      .populate('sellerId', 'name companyName email')
      .lean();
    }

    // Sanitize DB products (exclude costPrice, minimumPrice, etc.)
    const sanitizedDbProducts = matchedProducts.map(p => ({
      id: p._id,
      name: p.name,
      category: p.category,
      price: p.price,
      stock: p.stock,
      unit: p.unit,
      sku: p.sku,
      moq: p.moq || 1,
      supplier_name: p.sellerId?.companyName || p.sellerId?.name || 'Verified Supplier',
      supplier_id: p.sellerId?._id
    }));

    // Find unique suppliers offering these matched products
    const sellerIds = [...new Set(matchedProducts.map(p => p.sellerId?._id?.toString()).filter(Boolean))];
    const matchedSuppliers = await User.find({
      _id: { $in: sellerIds },
      role: 'seller'
    })
    .select('name companyName email createdAt')
    .lean();

    const sanitizedDbSuppliers = matchedSuppliers.map(s => ({
      id: s._id,
      company_name: s.companyName || s.name,
      contact_name: s.name,
      email: s.email
    }));

    // 4. REAL Web Search for Market Research
    let webResults = [];
    if (reqItems.length > 0) {
      const primaryItem = reqItems[0].item_name;
      webResults = await searchWebProducts(primaryItem);
    }

    // 5. Backend Feasibility Check
    for (const item of reqItems) {
      const match = sanitizedDbProducts.find(p => p.name.toLowerCase().includes(item.item_name.toLowerCase()));
      const unitPrice = match ? match.price : 1500;
      calculatedEstTotal += unitPrice * item.quantity;
    }

    const isFeasible = calculatedEstTotal <= (analysis.total_budget || 100000);

    res.json({
      analysis,
      dbMatches: {
        products: sanitizedDbProducts,
        suppliers: sanitizedDbSuppliers
      },
      webResults,
      feasibility: {
        isFeasible,
        calculatedEstTotal,
        budgetDiff: (analysis.total_budget || 100000) - calculatedEstTotal
      }
    });

  } catch (err) {
    console.error('AI Procurement Analysis error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/search-products - Web Search Endpoint
router.post('/search-products', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const webResults = await searchWebProducts(query.trim());
    res.json({ webResults });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
