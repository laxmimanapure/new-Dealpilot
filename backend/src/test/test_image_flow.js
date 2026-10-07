const { connectDB, mongoose } = require('../db');
const User = require('../models/User');
const Product = require('../models/Product');
const { getDefaultProductImage } = require('../seed');

async function testImageFlow() {
  console.log('--- Testing Product Image End-to-End Flow ---');
  await connectDB();

  try {
    const seller = await User.findOne({ role: 'seller' });
    if (!seller) {
      console.error('❌ No seller user found in database!');
      process.exit(1);
    }

    // 1. Create a product named "pencil" with custom image URL
    const testImageUrl = '/uploads/pencil-custom-test.jpg';
    
    // Remove existing test pencil if present
    await Product.deleteMany({ sellerId: seller._id, name: 'Test Pencil' });

    const newProd = await Product.create({
      sellerId: seller._id,
      name: 'Test Pencil',
      category: 'Stationery',
      description: 'HB Graphite Pencil',
      sku: 'TEST-PENCIL-001',
      imageUrl: testImageUrl,
      price: 25,
      costPrice: 15,
      stock: 50,
      unit: 'pcs'
    });

    console.log(`✅ 1. Product created in DB with ID: ${newProd._id}`);
    console.log(`   Stored imageUrl in DB: ${newProd.imageUrl}`);

    // 2. Query product back from MongoDB
    const fetchedProd = await Product.findById(newProd._id).lean();
    console.log(`✅ 2. Product fetched back from DB.`);
    console.log(`   Fetched imageUrl: ${fetchedProd.imageUrl}`);

    if (fetchedProd.imageUrl === testImageUrl) {
      console.log('🎉 VERIFICATION SUCCESS: Stored image URL matches uploaded image URL exactly!');
    } else {
      console.error(`❌ VERIFICATION FAILED: Expected ${testImageUrl}, got ${fetchedProd.imageUrl}`);
    }

    // Clean up test product
    await Product.findByIdAndDelete(newProd._id);
    console.log('🧹 Cleaned up test product.');

    mongoose.connection.close();
  } catch (err) {
    console.error('❌ Test error:', err);
    process.exit(1);
  }
}

testImageFlow();
