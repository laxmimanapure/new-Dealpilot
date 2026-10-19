const express = require('express');
const router = express.Router();
const { parseBuyerPrompt } = require('../services/aiService');
const { searchWebProducts } = require('../services/webSearchService');
const { matchProductToItem, buildItemNegotiationProfile } = require('../services/negotiationEngine');
const Product = require('../models/Product');
const ProductRule = require('../models/ProductRule');
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
    console.log(`   Extracted Budget: ₹${analysis.total_budget} (Explicit: ${Boolean(analysis.has_explicit_budget)})`);
    console.log(`   Extracted Deadline: ${analysis.deadline_days} days`);
    console.log(`===================================================\n`);

    // 2. Deterministic Backend Budget Check & Feasibility Validation
    const reqItems = analysis.items || [];
    let calculatedEstTotal = 0;

    // 3. Search Real MongoDB Database for matching DealPilot products & suppliers using matchProductToItem + ProductRule
    let matchedProducts = [];
    const ruleByProductId = {};

    if (reqItems.length > 0) {
      const allActiveProducts = await Product.find({ active: { $ne: false } })
        .populate('sellerId', 'name companyName email')
        .lean();

      matchedProducts = allActiveProducts.filter(p =>
        reqItems.some(item => matchProductToItem(item.item_name, p).matches)
      );

      if (matchedProducts.length > 0) {
        const prodIds = matchedProducts.map(p => p._id);
        const rules = await ProductRule.find({ productId: { $in: prodIds } }).lean();
        for (const r of rules) {
          if (r.productId) {
            ruleByProductId[r.productId.toString()] = r;
          }
        }
      }
    }

    // Evaluate each matched product against the matching requested item(s) using buildItemNegotiationProfile
    const sanitizedDbProducts = matchedProducts.map(p => {
      const pIdStr = p._id.toString();
      const sellerDoc = p.sellerId && typeof p.sellerId === 'object' ? p.sellerId : null;
      const sellerIdVal = sellerDoc ? sellerDoc._id : p.sellerId;
      const supplierName = sellerDoc?.companyName || sellerDoc?.name || 'Verified Supplier';
      const rawRule = ruleByProductId[pIdStr] || null;
      const validRule = (
        rawRule &&
        (!rawRule.sellerId || !sellerIdVal || rawRule.sellerId.toString() === sellerIdVal.toString())
      )
        ? rawRule
        : null;

      // Find best matching requested item to evaluate quantity feasibility
      let bestReqItem = reqItems[0] || { quantity: 1 };
      let bestScore = -1;
      for (const item of reqItems) {
        const m = matchProductToItem(item.item_name, p);
        if (m.matches && m.score > bestScore) {
          bestScore = m.score;
          bestReqItem = item;
        }
      }

      const reqQty = Number(bestReqItem?.quantity || 1);
      const profile = buildItemNegotiationProfile(p, validRule, reqQty);

      let canFulfill = true;
      let rejectionReason = null;

      if (Number(p.stock ?? 0) < reqQty) {
        canFulfill = false;
        rejectionReason = `Stock deficit: Requested ${reqQty} units of "${p.name}", but seller "${supplierName}" only has ${p.stock} units in stock.`;
      } else if (reqQty < profile.effectiveMOQ) {
        canFulfill = false;
        rejectionReason = `MOQ breach: Requested quantity (${reqQty}) is below minimum order quantity (MOQ: ${profile.effectiveMOQ}) for product "${p.name}".`;
      } else if (profile.maxQuantityRule !== null && reqQty > profile.maxQuantityRule) {
        canFulfill = false;
        rejectionReason = `Maximum quantity breach: Requested quantity (${reqQty}) exceeds seller maximum order quantity (${profile.maxQuantityRule}) for product "${p.name}".`;
      } else if (profile.initialMarginPct < profile.marginFloorPct) {
        canFulfill = false;
        rejectionReason = `Margin floor breach: Product "${p.name}" list price margin (${profile.initialMarginPct}%) is below minimum required margin floor (${profile.marginFloorPct}%).`;
      } else if (profile.effectiveMinAllowedPrice > profile.totalListPrice) {
        canFulfill = false;
        rejectionReason = `Policy floor breach: Configured minimum price floor (₹${profile.effectiveMinAllowedPrice}) exceeds list price (₹${profile.totalListPrice}) for product "${p.name}".`;
      }

      return {
        id: p._id,
        _id: p._id,
        productId: p._id,
        sellerId: sellerIdVal,
        name: p.name,
        category: p.category,
        price: p.price,
        stock: p.stock,
        unit: p.unit,
        sku: p.sku,
        moq: profile.effectiveMOQ,
        canFulfill,
        rejectionReason,
        supplier_name: supplierName,
        supplier_id: sellerIdVal
      };
    });

    // Find unique suppliers offering these matched products and summarize their feasibility
    const sellerIds = [...new Set(sanitizedDbProducts.map(p => p.supplier_id?.toString()).filter(Boolean))];
    const matchedSuppliers = await User.find({
      _id: { $in: sellerIds },
      role: 'seller'
    })
      .select('name companyName email createdAt')
      .lean();

    const sanitizedDbSuppliers = matchedSuppliers.map(s => {
      const sIdStr = s._id.toString();
      const sProducts = sanitizedDbProducts.filter(p => p.supplier_id?.toString() === sIdStr);
      const feasibleProducts = sProducts.filter(p => p.canFulfill);
      const rejectionReasons = sProducts
        .filter(p => !p.canFulfill && p.rejectionReason)
        .map(p => p.rejectionReason);

      return {
        id: s._id,
        sellerId: s._id,
        company_name: s.companyName || s.name,
        contact_name: s.name,
        email: s.email,
        matched_products_count: sProducts.length,
        feasible_products_count: feasibleProducts.length,
        can_fulfill: feasibleProducts.length > 0,
        rejection_reasons: rejectionReasons
      };
    });

    // 4. REAL Web Search for Market Research
    let webResults = [];
    if (reqItems.length > 0) {
      const primaryItem = reqItems[0].item_name;
      webResults = await searchWebProducts(primaryItem);
    }

    // 5. Backend Feasibility Check & Product/Seller ID Enrichment (preserving buyer item_name)
    for (const item of reqItems) {
      const reqQty = Number(item.quantity || 1);
      const bestCandidates = sanitizedDbProducts
        .map(p => {
          const res = matchProductToItem(item.item_name, p);
          const itemCanFulfill = (Number(p.stock ?? 0) >= reqQty) && (reqQty >= Number(p.moq || 1)) && p.canFulfill !== false;
          return { p, res, itemCanFulfill };
        })
        .filter(m => m.res.matches)
        .sort((a, b) => {
          if (a.itemCanFulfill !== b.itemCanFulfill) {
            return a.itemCanFulfill ? -1 : 1;
          }
          if (b.res.score !== a.res.score) {
            return b.res.score - a.res.score;
          }
          return (Number(a.p.price || 0)) - (Number(b.p.price || 0));
        });

      const match = bestCandidates[0]?.p;
      if (match) {
        item.productId = match.id;
        item.sellerId = match.supplier_id;
        item.category = match.category;
        item.moq = match.moq || 1;
        item.unitPrice = match.price;
      }
      const unitPrice = match ? match.price : 1500;
      calculatedEstTotal += unitPrice * reqQty;
    }

    // If the buyer did not specify an explicit budget in the prompt, ensure default budget covers catalog list estimate
    if (!analysis.has_explicit_budget && calculatedEstTotal > (analysis.total_budget || 100000)) {
      analysis.total_budget = calculatedEstTotal;
      analysis.parsed_summary = `Parsed ${reqItems.length} requirement item(s) with estimated budget of ₹${calculatedEstTotal.toLocaleString('en-IN')} and ${analysis.deadline_days} days delivery window.`;
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
