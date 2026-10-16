const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const { connectDB, mongoose } = require('./db');
const User = require('./models/User');
const Product = require('./models/Product');
const ProductRule = require('./models/ProductRule');
const ProcurementRequirement = require('./models/ProcurementRequirement');
const SellerOffer = require('./models/SellerOffer');
const { processRequirementMatchingAndNegotiation } = require('./services/negotiationEngine');

async function runDiagnostics() {
  await connectDB();
  console.log('\n===================================================');
  console.log('🔍 [DATABASE DIAGNOSTIC START]');
  console.log('===================================================');

  const sellers = await User.find({ role: 'seller' }).lean();
  console.log(`\n1. SELLERS COUNT: ${sellers.length}`);
  sellers.forEach(s => {
    console.log(`  - ID: ${s._id}, Name: ${s.name}, Email: ${s.email}, Company: ${s.companyName}`);
  });

  const allProducts = await Product.find({}).lean();
  console.log(`\n2. TOTAL PRODUCTS COUNT: ${allProducts.length}`);
  allProducts.forEach(p => {
    console.log(`  - ID: ${p._id}, Name: "${p.name}", Category: "${p.category}", SellerId: ${p.sellerId}, Stock: ${p.stock}, Active: ${p.active}, Price: ₹${p.price}, MOQ: ${p.moq}`);
  });

  const activeProducts = await Product.find({ active: true, stock: { $gt: 0 } }).lean();
  console.log(`\n3. ACTIVE PRODUCTS (stock > 0): ${activeProducts.length}`);

  const requirements = await ProcurementRequirement.find({}).sort({ createdAt: -1 }).limit(10).lean();
  console.log(`\n4. RECENT REQUIREMENTS COUNT: ${requirements.length}`);
  for (const req of requirements) {
    console.log(`\n---------------------------------------------------`);
    console.log(`Requirement ID: ${req._id} | BuyerId: ${req.buyerId} | Status: ${req.status}`);
    console.log(`Raw Prompt: "${req.rawPrompt}"`);
    console.log(`Parsed Items:`, JSON.stringify(req.items));
    console.log(`Target Budget: ₹${req.targetBudget}, Deadline: ${req.deadlineDays} days`);

    console.log(`Running processRequirementMatchingAndNegotiation...`);
    const offers = await processRequirementMatchingAndNegotiation(req);
    console.log(`Returned Offers Count: ${offers.length}`);
    offers.forEach(o => {
      console.log(`   Offer ID: ${o._id}, SellerId: ${o.sellerId}, Original: ₹${o.originalAmount}, Negotiated: ₹${o.negotiatedAmount}, Status: ${o.status}, Reason: ${o.rejectionReason}`);
    });

    const existingOffersInDb = await SellerOffer.find({ requirementId: req._id }).lean();
    console.log(`SellerOffers saved in DB for this req: ${existingOffersInDb.length}`);
    existingOffersInDb.forEach(o => {
      console.log(`   DB Offer ID: ${o._id}, SellerId: ${o.sellerId}, Status: ${o.status}, RejectionReason: ${o.rejectionReason}`);
    });
  }

  console.log('\n===================================================');
  console.log('🔍 [DATABASE DIAGNOSTIC END]');
  console.log('===================================================\n');
  await mongoose.disconnect();
}

runDiagnostics().catch(err => {
  console.error('Diagnostic error:', err);
  process.exit(1);
});
