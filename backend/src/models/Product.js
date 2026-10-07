const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    sku: {
      type: String,
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'List price is required'],
      min: 0
    },
    costPrice: {
      type: Number,
      required: [true, 'Cost price is required'],
      min: 0
    },
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      min: 0,
      default: 100
    },
    unit: {
      type: String,
      default: 'units'
    },
    active: {
      type: Boolean,
      default: true
    },
    moq: {
      type: Number,
      default: 1
    },
    standardLeadTimeDays: {
      type: Number,
      default: 3
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Product', productSchema);
