const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const { connectDB, mongoose } = require('./db');
const { processRequirementMatchingAndNegotiation } = require('./services/negotiationEngine');

async function testAllScenarios() {
  await connectDB();
  console.log('\n===================================================');
  console.log('🧪 TESTING ALL 7 REQUIRED MATCHING SCENARIOS');
  console.log('===================================================');

  // Scenario 1: Active seller with matching product and sufficient stock
  const req1 = {
    _id: new mongoose.Types.ObjectId(),
    buyerId: new mongoose.Types.ObjectId(),
    rawPrompt: "I need 2 Dell Monitors for my office. Budget ₹60,000.",
    parsedSummary: "2 Dell Monitors",
    items: [{ item_name: "Dell Monitor", quantity: 2, estimated_budget: null }],
    targetBudget: 60000,
    deadlineDays: 7,
    status: 'SUBMITTED'
  };

  console.log('\n---------------------------------------------------');
  console.log('SCENARIO 1: Active seller with matching product and sufficient stock');
  const offers1 = await processRequirementMatchingAndNegotiation(req1);
  console.log(`Offers count: ${offers1.length}`);
  offers1.forEach(o => console.log(`  - Status: ${o.status} | SellerId: ${o.sellerId} | Original: ₹${o.originalAmount} | Negotiated: ₹${o.negotiatedAmount}`));

  // Scenario 2: Multiple sellers offering same/similar product category
  const req2 = {
    _id: new mongoose.Types.ObjectId(),
    buyerId: new mongoose.Types.ObjectId(),
    rawPrompt: "I need 20 erasers for school. Budget ₹2,000.",
    parsedSummary: "20 erasers",
    items: [{ item_name: "eraser", quantity: 20, estimated_budget: null }],
    targetBudget: 2000,
    deadlineDays: 7,
    status: 'SUBMITTED'
  };

  console.log('\n---------------------------------------------------');
  console.log('SCENARIO 2 & 3: Multiple sellers offering the same product (Erasers)');
  const offers2 = await processRequirementMatchingAndNegotiation(req2);
  console.log(`Offers count: ${offers2.length}`);
  offers2.forEach(o => console.log(`  - Status: ${o.status} | SellerId: ${o.sellerId} | Original: ₹${o.originalAmount} | Negotiated: ₹${o.negotiatedAmount}`));

  // Scenario 4: Quantity exceeds available stock
  const req4 = {
    _id: new mongoose.Types.ObjectId(),
    buyerId: new mongoose.Types.ObjectId(),
    rawPrompt: "I need 999 Standing Desks.",
    parsedSummary: "999 Standing Desks",
    items: [{ item_name: "Standing Desk", quantity: 999, estimated_budget: null }],
    targetBudget: 5000000,
    deadlineDays: 7,
    status: 'SUBMITTED'
  };

  console.log('\n---------------------------------------------------');
  console.log('SCENARIO 4: Request quantity exceeds available stock (999 Standing Desks)');
  const offers4 = await processRequirementMatchingAndNegotiation(req4);
  console.log(`Offers count: ${offers4.length}`);
  offers4.forEach(o => console.log(`  - Status: ${o.status} | RejectionReason: ${o.rejectionReason}`));

  // Scenario 5: Quantity below MOQ
  const req5 = {
    _id: new mongoose.Types.ObjectId(),
    buyerId: new mongoose.Types.ObjectId(),
    rawPrompt: "I need 1 Standard A4 Copy Paper box.",
    parsedSummary: "1 Standard A4 Copy Paper box",
    items: [{ item_name: "Standard A4 Copy Paper", quantity: 1, estimated_budget: null }],
    targetBudget: 5000,
    deadlineDays: 7,
    status: 'SUBMITTED'
  };

  console.log('\n---------------------------------------------------');
  console.log('SCENARIO 5: Quantity below MOQ (1 A4 Paper box vs MOQ 10)');
  const offers5 = await processRequirementMatchingAndNegotiation(req5);
  console.log(`Offers count: ${offers5.length}`);
  offers5.forEach(o => console.log(`  - Status: ${o.status} | RejectionReason: ${o.rejectionReason}`));

  // Scenario 6: Proposed price / target budget lower than minimum price floor
  const req6 = {
    _id: new mongoose.Types.ObjectId(),
    buyerId: new mongoose.Types.ObjectId(),
    rawPrompt: "I need 1 Dell UltraSharp 27 Monitor for ₹500.",
    parsedSummary: "1 Dell Monitor at ₹500",
    items: [{ item_name: "Dell UltraSharp 27 Monitor", quantity: 1, estimated_budget: 500 }],
    targetBudget: 500,
    deadlineDays: 7,
    status: 'SUBMITTED'
  };

  console.log('\n---------------------------------------------------');
  console.log('SCENARIO 6: Budget (₹500) lower than minimum price floor (Over-budget)');
  const offers6 = await processRequirementMatchingAndNegotiation(req6);
  console.log(`Offers count: ${offers6.length}`);
  offers6.forEach(o => console.log(`  - Status: ${o.status} | RejectionReason: ${o.rejectionReason}`));

  // Scenario 7: No eligible seller genuinely exists
  const req7 = {
    _id: new mongoose.Types.ObjectId(),
    buyerId: new mongoose.Types.ObjectId(),
    rawPrompt: "I need 5 Nuclear Fusion Space Rockets.",
    parsedSummary: "5 Nuclear Fusion Space Rockets",
    items: [{ item_name: "Nuclear Fusion Space Rocket", quantity: 5, estimated_budget: 1000000 }],
    targetBudget: 1000000,
    deadlineDays: 7,
    status: 'SUBMITTED'
  };

  console.log('\n---------------------------------------------------');
  console.log('SCENARIO 7: No eligible seller genuinely exists (Space Rockets)');
  const offers7 = await processRequirementMatchingAndNegotiation(req7);
  console.log(`Offers count: ${offers7.length}`);

  console.log('\n===================================================');
  console.log('✅ ALL 7 TEST SCENARIOS EXECUTED SUCCESSFULLY!');
  console.log('===================================================\n');

  await mongoose.disconnect();
}

testAllScenarios().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
