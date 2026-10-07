require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB, mongoose } = require('./db');
const User = require('./models/User');
const Product = require('./models/Product');
const ProductRule = require('./models/ProductRule');
const ProcurementRequirement = require('./models/ProcurementRequirement');
const SellerOffer = require('./models/SellerOffer');
const Order = require('./models/Order');
const AuditLog = require('./models/AuditLog');
const { processRequirementMatchingAndNegotiation } = require('./services/negotiationEngine');

async function seedDatabase(shouldCloseConnection = false) {
  try {
    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Check/Create Demo Buyer
    let buyer = await User.findOne({ email: 'buyer@brightpath.edu' });
    if (!buyer) {
      buyer = await User.create({
        name: 'Laxmi Manapure',
        email: 'buyer@brightpath.edu',
        passwordHash,
        role: 'buyer',
        companyName: 'BrightPath Institute',
        phone: '+91 98765 43210'
      });
      console.log('✅ Demo Buyer (buyer@brightpath.edu) initialized in MongoDB Atlas');
    }

    // 2. Check/Create Demo Seller A
    let sellerA = await User.findOne({ email: 'sellerA@officegear.in' });
    if (!sellerA) {
      sellerA = await User.create({
        name: 'OfficeGear Sales',
        email: 'sellerA@officegear.in',
        passwordHash,
        role: 'seller',
        companyName: 'OfficeGear Direct',
        phone: '+91 98765 12345'
      });
      console.log('✅ Demo Seller A (sellerA@officegear.in) initialized in MongoDB Atlas');

      const prodKeyboardA = await Product.create({
        sellerId: sellerA._id,
        name: 'Mechanical Ergonomic Keyboard',
        category: 'Peripherals',
        description: 'Tactile mechanical switch keyboard for office environments.',
        sku: 'OG-KB-001',
        price: 2000,
        costPrice: 1400,
        stock: 150,
        unit: 'pcs',
        active: true,
        moq: 5,
        standardLeadTimeDays: 3
      });

      const prodMouseA = await Product.create({
        sellerId: sellerA._id,
        name: 'Wireless Precision Mouse',
        category: 'Peripherals',
        description: 'High precision 4000 DPI wireless optical mouse.',
        sku: 'OG-MS-002',
        price: 1000,
        costPrice: 650,
        stock: 200,
        unit: 'pcs',
        active: true,
        moq: 5,
        standardLeadTimeDays: 3
      });

      const prodHeadsetA = await Product.create({
        sellerId: sellerA._id,
        name: 'Noise Cancelling Headset',
        category: 'Audio',
        description: 'Over-ear USB headset with noise-cancelling microphone.',
        sku: 'OG-HS-003',
        price: 3000,
        costPrice: 2000,
        stock: 120,
        unit: 'pcs',
        active: true,
        moq: 5,
        standardLeadTimeDays: 3
      });

      await ProductRule.create({
        productId: prodKeyboardA._id,
        sellerId: sellerA._id,
        minimumPrice: 1750,
        maximumDiscountPercent: 12.5,
        minimumQuantity: 5,
        earlyPaymentDiscount: 2.0,
        leadTimeExtraDiscount: 1.0,
        marginFloorPercent: 10.0,
        negotiationEnabled: true
      });

      await ProductRule.create({
        productId: prodMouseA._id,
        sellerId: sellerA._id,
        minimumPrice: 880,
        maximumDiscountPercent: 12.0,
        minimumQuantity: 5,
        earlyPaymentDiscount: 2.0,
        leadTimeExtraDiscount: 1.0,
        marginFloorPercent: 10.0,
        negotiationEnabled: true
      });

      await ProductRule.create({
        productId: prodHeadsetA._id,
        sellerId: sellerA._id,
        minimumPrice: 2600,
        maximumDiscountPercent: 13.3,
        minimumQuantity: 5,
        earlyPaymentDiscount: 2.0,
        leadTimeExtraDiscount: 1.0,
        marginFloorPercent: 10.0,
        negotiationEnabled: true
      });
    }

    // 3. Check/Create Demo Seller B
    let sellerB = await User.findOne({ email: 'sellerB@techsupply.in' });
    if (!sellerB) {
      sellerB = await User.create({
        name: 'TechSupply India',
        email: 'sellerB@techsupply.in',
        passwordHash,
        role: 'seller',
        companyName: 'TechSupply Solutions',
        phone: '+91 98765 67890'
      });
      console.log('✅ Demo Seller B (sellerB@techsupply.in) initialized in MongoDB Atlas');

      const prodKeyboardB = await Product.create({
        sellerId: sellerB._id,
        name: 'Mechanical Ergonomic Keyboard',
        category: 'Peripherals',
        description: 'Premium mechanical keyboard with quiet switches.',
        sku: 'TS-KB-101',
        price: 1950,
        costPrice: 1350,
        stock: 300,
        unit: 'pcs',
        active: true,
        moq: 10,
        standardLeadTimeDays: 5
      });

      const prodMouseB = await Product.create({
        sellerId: sellerB._id,
        name: 'Wireless Precision Mouse',
        category: 'Peripherals',
        description: 'Ergonomic 2.4G wireless mouse.',
        sku: 'TS-MS-102',
        price: 950,
        costPrice: 600,
        stock: 300,
        unit: 'pcs',
        active: true,
        moq: 10,
        standardLeadTimeDays: 5
      });

      const prodHeadsetB = await Product.create({
        sellerId: sellerB._id,
        name: 'Noise Cancelling Headset',
        category: 'Audio',
        description: 'Professional call center USB stereo headset.',
        sku: 'TS-HS-103',
        price: 2900,
        costPrice: 1850,
        stock: 250,
        unit: 'pcs',
        active: true,
        moq: 10,
        standardLeadTimeDays: 5
      });

      await ProductRule.create({
        productId: prodKeyboardB._id,
        sellerId: sellerB._id,
        minimumPrice: 1650,
        maximumDiscountPercent: 15.0,
        minimumQuantity: 10,
        earlyPaymentDiscount: 2.5,
        leadTimeExtraDiscount: 1.5,
        marginFloorPercent: 8.0,
        negotiationEnabled: true
      });

      await ProductRule.create({
        productId: prodMouseB._id,
        sellerId: sellerB._id,
        minimumPrice: 800,
        maximumDiscountPercent: 15.0,
        minimumQuantity: 10,
        earlyPaymentDiscount: 2.5,
        leadTimeExtraDiscount: 1.5,
        marginFloorPercent: 8.0,
        negotiationEnabled: true
      });

      await ProductRule.create({
        productId: prodHeadsetB._id,
        sellerId: sellerB._id,
        minimumPrice: 2450,
        maximumDiscountPercent: 15.5,
        minimumQuantity: 10,
        earlyPaymentDiscount: 2.5,
        leadTimeExtraDiscount: 1.5,
        marginFloorPercent: 8.0,
        negotiationEnabled: true
      });
    }

    // 4. Check/Create initial Procurement Requirements for Demo Buyer
    if (buyer) {
      const reqCount = await ProcurementRequirement.countDocuments({ buyerId: buyer._id });
      if (reqCount === 0) {
        const req1 = await ProcurementRequirement.create({
          buyerId: buyer._id,
          rawPrompt: 'Laptop Accessories (5 items)',
          parsedSummary: '3 Sellers Negotiated • Best deal identified',
          items: [
            { item_name: 'Mechanical Ergonomic Keyboard', quantity: 5, estimated_budget: 10000 },
            { item_name: 'Wireless Precision Mouse', quantity: 5, estimated_budget: 5000 }
          ],
          targetBudget: 45000,
          deadlineDays: 14,
          status: 'SUBMITTED'
        });
        await processRequirementMatchingAndNegotiation(req1);

        const req2 = await ProcurementRequirement.create({
          buyerId: buyer._id,
          rawPrompt: 'Office Chairs (10 ergonomic mesh chairs)',
          parsedSummary: '3 Sellers Negotiated • Rule matching active',
          items: [
            { item_name: 'Noise Cancelling Headset', quantity: 10, estimated_budget: 30000 }
          ],
          targetBudget: 120000,
          deadlineDays: 14,
          status: 'SUBMITTED'
        });
        await processRequirementMatchingAndNegotiation(req2);

        const req3 = await ProcurementRequirement.create({
          buyerId: buyer._id,
          rawPrompt: 'Stationery Supplies & Peripherals',
          parsedSummary: '4 Sellers Negotiated • Completed & Confirmed',
          items: [
            { item_name: 'Mechanical Ergonomic Keyboard', quantity: 10, estimated_budget: 20000 }
          ],
          targetBudget: 8450,
          deadlineDays: 7,
          status: 'SUBMITTED'
        });
        await processRequirementMatchingAndNegotiation(req3);

        console.log('✅ Demo Procurement Requirements initialized in MongoDB for buyer@brightpath.edu');
      }
    }

    if (shouldCloseConnection) {
      mongoose.connection.close();
    }
  } catch (err) {
    console.error('❌ Seed error:', err);
  }
}

if (require.main === module) {
  (async () => {
    await connectDB();
    await seedDatabase(true);
  })();
}

module.exports = { seedDatabase };
