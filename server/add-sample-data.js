/**
 * Add sample Product Inquiries and Service Quotes to test the admin interface
 */
require('dotenv').config();
const mongoose = require('mongoose');

async function addSampleData() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Import models
    const ProductInquiry = require('./src/models/ProductInquiry');
    const ServiceQuote = require('./src/models/ServiceQuote');
    const Product = require('./src/models/Product');
    const Service = require('./src/models/Service');

    // Get a sample product
    const sampleProduct = await Product.findOne();
    const sampleService = await Service.findOne();

    // Add sample Product Inquiries
    console.log('📨 Adding sample Product Inquiries...');
    const inquiries = [
      {
        product: sampleProduct ? sampleProduct._id : null,
        productName: sampleProduct ? sampleProduct.name : 'Sample ERP System',
        customerEmail: 'john.doe@example.com',
        customerPhone: '0771234567',
        preferredContact: 'email',
        message: 'I am interested in getting more information about this product for my business.',
        status: 'new',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          createdAt: new Date()
        }
      },
      {
        product: sampleProduct ? sampleProduct._id : null,
        productName: sampleProduct ? sampleProduct.name : 'Sample CRM Software',
        customerEmail: 'mary.smith@company.com',
        customerPhone: '0782345678',
        preferredContact: 'phone',
        message: 'Please send me a detailed quote for this product.',
        status: 'contacted',
        metadata: {
          ipAddress: '192.168.1.2',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
        }
      },
      {
        product: sampleProduct ? sampleProduct._id : null,
        productName: 'IoT Sensors',
        customerEmail: 'tech@startup.io',
        customerPhone: '0793456789',
        preferredContact: 'email',
        message: 'How does this integrate with our existing systems?',
        status: 'new',
        metadata: {
          ipAddress: '192.168.1.3',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        }
      }
    ];

    for (const inquiry of inquiries) {
      const newInquiry = new ProductInquiry(inquiry);
      await newInquiry.save();
      console.log(`   ✅ Added inquiry from ${inquiry.customerEmail}`);
    }

    // Add sample Service Quotes
    console.log('\n💼 Adding sample Service Quotes...');
    const quotes = [
      {
        service: sampleService ? sampleService._id : null,
        serviceName: 'Website Development',
        customerName: 'Alice Johnson',
        customerEmail: 'alice@business.com',
        customerPhone: '0704567890',
        companyName: 'ABC Corporation',
        preferredContact: 'email',
        projectDetails: 'We need a modern e-commerce website with payment integration.',
        budget: '$5,000 - $10,000',
        timeline: '2-3 months',
        status: 'new',
        metadata: {
          ipAddress: '192.168.1.4',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          createdAt: new Date()
        }
      },
      {
        service: sampleService ? sampleService._id : null,
        serviceName: 'SEO Optimization',
        customerName: 'Bob Williams',
        customerEmail: 'bob@marketing.co',
        customerPhone: '0715678901',
        companyName: 'XYZ Marketing',
        preferredContact: 'phone',
        projectDetails: 'Looking to improve our search engine rankings for local services.',
        budget: '< $5,000',
        timeline: '1 month',
        status: 'quoted',
        metadata: {
          ipAddress: '192.168.1.5',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
        }
      },
      {
        service: null,
        serviceName: 'Custom Software Development',
        customerName: 'Carol Davis',
        customerEmail: 'carol@tech.startup',
        customerPhone: '0726789012',
        companyName: 'Tech Innovations Ltd',
        preferredContact: 'email',
        projectDetails: 'Need a custom inventory management system with mobile app.',
        budget: '$25,000 - $50,000',
        timeline: '3+ months',
        status: 'contacted',
        metadata: {
          ipAddress: '192.168.1.6',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
        }
      }
    ];

    for (const quote of quotes) {
      const newQuote = new ServiceQuote(quote);
      await newQuote.save();
      console.log(`   ✅ Added quote from ${quote.customerName}`);
    }

    console.log('\n✅ Sample data added successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Product Inquiries: ${inquiries.length}`);
    console.log(`   Service Quotes: ${quotes.length}`);
    console.log('\n🎯 Now check the Admin Dashboard to see the data!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

addSampleData();
