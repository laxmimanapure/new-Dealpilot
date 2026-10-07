const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const { authenticateToken } = require('../middleware/auth');
const { getDefaultProductImage } = require('../seed');

router.use(authenticateToken);

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET /api/search?q=query - Global Search (Products & Suppliers)
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q || req.query.query || '';
    if (!q || !q.trim()) {
      return res.json({ products: [], suppliers: [] });
    }

    const cleanQuery = q.trim();
    const regex = new RegExp(escapeRegex(cleanQuery), 'i');

    const dbProducts = await Product.find({
      active: true,
      $or: [
        { name: regex },
        { category: regex },
        { description: regex },
        { sku: regex }
      ]
    })
    .populate('sellerId', 'name companyName email')
    .lean();

    const sanitizedProducts = dbProducts.map(p => {
      const img = p.imageUrl || getDefaultProductImage(p.name, p.category);
      return {
        id: p._id,
        _id: p._id,
        name: p.name,
        category: p.category,
        description: p.description,
        sku: p.sku,
        imageUrl: img,
        image: img,
        price: p.price,
        list_price: p.price,
        stock: p.stock,
        unit: p.unit,
        moq: p.moq,
        standard_lead_time_days: p.standardLeadTimeDays,
        seller_id: p.sellerId?._id,
        supplier_name: p.sellerId?.companyName || p.sellerId?.name || 'Verified Supplier',
        supplier_email: p.sellerId?.email
      };
    });

    const directSuppliers = await User.find({
      role: 'seller',
      $or: [
        { name: regex },
        { companyName: regex },
        { email: regex }
      ]
    })
    .select('name companyName email createdAt')
    .lean();

    const productSellerIds = dbProducts.map(p => p.sellerId?._id?.toString()).filter(Boolean);
    const productSuppliers = await User.find({
      _id: { $in: productSellerIds },
      role: 'seller'
    })
    .select('name companyName email createdAt')
    .lean();

    const supplierMap = new Map();
    [...directSuppliers, ...productSuppliers].forEach(s => {
      if (!supplierMap.has(s._id.toString())) {
        supplierMap.set(s._id.toString(), s);
      }
    });

    const combinedSuppliers = Array.from(supplierMap.values());

    const sanitizedSuppliers = await Promise.all(combinedSuppliers.map(async s => {
      const activeProductsCount = await Product.countDocuments({ sellerId: s._id, active: true });
      const completedOrdersCount = await Order.countDocuments({ sellerId: s._id, orderStatus: 'CONFIRMED' });
      return {
        id: s._id,
        _id: s._id,
        company_name: s.companyName || s.name,
        contact_name: s.name,
        email: s.email,
        active_products: activeProductsCount,
        completed_orders: completedOrdersCount,
        joined_at: s.createdAt
      };
    }));

    res.json({
      products: sanitizedProducts,
      suppliers: sanitizedSuppliers
    });

  } catch (err) {
    console.error('Global search error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/search?q=query - Search Products
router.get('/products/search', async (req, res) => {
  try {
    const q = req.query.q || req.query.query || '';
    if (!q || !q.trim()) {
      return res.json({ products: [] });
    }

    const regex = new RegExp(escapeRegex(q.trim()), 'i');
    const dbProducts = await Product.find({
      active: true,
      $or: [
        { name: regex },
        { category: regex },
        { description: regex },
        { sku: regex }
      ]
    })
    .populate('sellerId', 'name companyName email')
    .lean();

    const sanitizedProducts = dbProducts.map(p => {
      const img = p.imageUrl || getDefaultProductImage(p.name, p.category);
      return {
        id: p._id,
        _id: p._id,
        name: p.name,
        category: p.category,
        description: p.description,
        sku: p.sku,
        imageUrl: img,
        image: img,
        price: p.price,
        list_price: p.price,
        stock: p.stock,
        unit: p.unit,
        supplier_name: p.sellerId?.companyName || p.sellerId?.name || 'Verified Supplier',
        supplier_id: p.sellerId?._id
      };
    });

    res.json({ products: sanitizedProducts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/suppliers/search?q=query - Search Suppliers
router.get('/suppliers/search', async (req, res) => {
  try {
    const q = req.query.q || req.query.query || '';
    if (!q || !q.trim()) {
      const allSellers = await User.find({ role: 'seller' }).select('name companyName email createdAt').lean();
      const formatted = await Promise.all(allSellers.map(async s => {
        const activeProductsCount = await Product.countDocuments({ sellerId: s._id, active: true });
        const completedOrdersCount = await Order.countDocuments({ sellerId: s._id, orderStatus: 'CONFIRMED' });
        return {
          id: s._id,
          _id: s._id,
          company_name: s.companyName || s.name,
          contact_name: s.name,
          email: s.email,
          active_products: activeProductsCount,
          completed_orders: completedOrdersCount,
          joined_at: s.createdAt
        };
      }));
      return res.json({ suppliers: formatted });
    }

    const regex = new RegExp(escapeRegex(q.trim()), 'i');

    const directSuppliers = await User.find({
      role: 'seller',
      $or: [
        { name: regex },
        { companyName: regex },
        { email: regex }
      ]
    }).select('name companyName email createdAt').lean();

    const matchingProducts = await Product.find({
      active: true,
      $or: [{ name: regex }, { category: regex }]
    }).select('sellerId').lean();

    const sellerIds = matchingProducts.map(p => p.sellerId?.toString()).filter(Boolean);
    const productSuppliers = await User.find({
      _id: { $in: sellerIds },
      role: 'seller'
    }).select('name companyName email createdAt').lean();

    const map = new Map();
    [...directSuppliers, ...productSuppliers].forEach(s => {
      if (!map.has(s._id.toString())) {
        map.set(s._id.toString(), s);
      }
    });

    const formatted = await Promise.all(Array.from(map.values()).map(async s => {
      const activeProductsCount = await Product.countDocuments({ sellerId: s._id, active: true });
      const completedOrdersCount = await Order.countDocuments({ sellerId: s._id, orderStatus: 'CONFIRMED' });
      return {
        id: s._id,
        _id: s._id,
        company_name: s.companyName || s.name,
        contact_name: s.name,
        email: s.email,
        active_products: activeProductsCount,
        completed_orders: completedOrdersCount,
        joined_at: s.createdAt
      };
    }));

    res.json({ suppliers: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
