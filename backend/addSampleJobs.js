const mongoose = require('mongoose');
require('dotenv').config();

const Job = require('./src/models/Job');
const Client = require('./src/models/Client');
const User = require('./src/models/User');

async function addSampleJobs() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Get the admin user
    const admin = await User.findOne({ email: 'developer@gmail.com' });
    if (!admin) {
      console.log('❌ Admin user not found');
      process.exit(1);
    }

    // Create sample clients
    const sampleClients = [
      {
        name: 'John Smith',
        email: 'john.smith@example.com',
        phone: '(555) 123-4567',
        address: '123 Oak Street, Springfield, IL 62701',
        clientType: 'residential',
        status: 'active'
      },
      {
        name: 'Bistro 22 Restaurant',
        email: 'manager@bistro22.com',
        phone: '(555) 234-5678',
        address: '456 Main Street, Downtown, IL 62702',
        clientType: 'commercial',
        status: 'active'
      },
      {
        name: 'Tech Corp Office',
        email: 'facilities@techcorp.com',
        phone: '(555) 345-6789',
        address: '789 Business Pkwy, Tech Park, IL 62703',
        clientType: 'commercial',
        status: 'active'
      }
    ];

    const clients = [];
    for (const clientData of sampleClients) {
      try {
        let client = await Client.findOne({ email: clientData.email });
        if (!client) {
          client = await Client.create(clientData);
          console.log(`✓ Created client: ${client.name}`);
        } else {
          console.log(`⊘ Client exists: ${client.name}`);
        }
        clients.push(client);
      } catch (error) {
        console.log(`✗ Error creating client ${clientData.name}:`, error.message);
      }
    }

    // Sample jobs with full cost data
    const sampleJobs = [
      {
        title: 'Panel Upgrade - Residential',
        description: 'Replace outdated 100A panel with new 200A panel, update main breaker, add GFCI breakers for bathrooms and kitchen.',
        client: clients[0]._id,
        status: 'completed',
        priority: 'high',
        location: {
          street: '123 Oak Street',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62701'
        },
        scheduledDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        completionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        costs: {
          laborHours: 8,
          laborRate: 85,
          materials: [
            { name: '200A Panel Box', description: 'Square D QO series', quantity: 1, unitPrice: 450, totalPrice: 450 },
            { name: 'GFCI Breakers', description: '20A GFCI breakers', quantity: 3, unitPrice: 45, totalPrice: 135 },
            { name: 'Wire & Conduit', description: 'Various gauges', quantity: 1, unitPrice: 120, totalPrice: 120 }
          ],
          equipment: [
            { name: 'Panel Installation Tools', cost: 50 }
          ],
          permitsCost: 150,
          subcontractorsCost: 0,
          otherCosts: 75,
          taxRate: 0.0825,
          discount: 0
        },
        actualExpenses: {
          laborHours: 7.5,
          laborRate: 85,
          materials: [
            { name: '200A Panel Box', description: 'Square D QO series', quantity: 1, unitPrice: 450, totalPrice: 450 },
            { name: 'GFCI Breakers', description: '20A GFCI breakers', quantity: 3, unitPrice: 45, totalPrice: 135 },
            { name: 'Wire & Conduit', description: 'Various gauges', quantity: 1, unitPrice: 95, totalPrice: 95 }
          ],
          equipment: [
            { name: 'Panel Installation Tools', cost: 50 }
          ],
          permitsCost: 150,
          subcontractorsCost: 0,
          otherCosts: 50,
          taxRate: 0.0825,
          discount: 0,
          enteredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          enteredBy: 'Developer Admin'
        },
        payment: {
          method: 'check',
          depositAmount: 500,
          amountPaid: 1500,
          terms: 'Net 30'
        }
      },
      {
        title: 'Commercial Kitchen Outlet Installation',
        description: 'Install 6 new 120V outlets and 1 dedicated 240V circuit for commercial oven in restaurant kitchen.',
        client: clients[1]._id,
        status: 'in-progress',
        priority: 'medium',
        location: {
          street: '456 Main Street',
          city: 'Downtown',
          state: 'IL',
          zipCode: '62702'
        },
        scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        costs: {
          laborHours: 12,
          laborRate: 95,
          materials: [
            { name: 'Commercial Grade Outlets', description: '120V 20A', quantity: 6, unitPrice: 25, totalPrice: 150 },
            { name: '240V Circuit Breaker', description: '50A double pole', quantity: 1, unitPrice: 65, totalPrice: 65 },
            { name: 'Wire & Conduit', description: 'Heavy duty', quantity: 1, unitPrice: 280, totalPrice: 280 },
            { name: 'Junction Boxes', description: 'Metal boxes', quantity: 7, unitPrice: 15, totalPrice: 105 }
          ],
          equipment: [
            { name: 'Conduit Bender', cost: 75 },
            { name: 'Drill & Bits', cost: 35 }
          ],
          permitsCost: 200,
          subcontractorsCost: 0,
          otherCosts: 100,
          taxRate: 0.0825,
          discount: 100
        },
        payment: {
          method: 'credit-card',
          depositAmount: 600,
          amountPaid: 600,
          terms: 'Net 30'
        }
      },
      {
        title: 'Office LED Lighting Retrofit',
        description: 'Replace all fluorescent fixtures with LED panels, install smart dimmer controls, upgrade to LED emergency lighting.',
        client: clients[2]._id,
        status: 'scheduled',
        priority: 'low',
        location: {
          street: '789 Business Pkwy',
          city: 'Tech Park',
          state: 'IL',
          zipCode: '62703'
        },
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        costs: {
          laborHours: 16,
          laborRate: 85,
          materials: [
            { name: 'LED Panel Lights', description: '2x4 40W panels', quantity: 24, unitPrice: 85, totalPrice: 2040 },
            { name: 'Smart Dimmers', description: 'Lutron Caseta', quantity: 4, unitPrice: 120, totalPrice: 480 },
            { name: 'LED Emergency Lights', description: 'Exit signs', quantity: 6, unitPrice: 45, totalPrice: 270 },
            { name: 'Mounting Hardware', description: 'Various', quantity: 1, unitPrice: 150, totalPrice: 150 }
          ],
          equipment: [
            { name: 'Scissor Lift Rental', cost: 250 },
            { name: 'Installation Tools', cost: 100 }
          ],
          permitsCost: 0,
          subcontractorsCost: 0,
          otherCosts: 125,
          taxRate: 0.0825,
          discount: 200
        },
        payment: {
          method: 'bank-transfer',
          depositAmount: 1000,
          amountPaid: 1000,
          terms: 'Net 30'
        }
      },
      {
        title: 'EV Charger Installation - Tesla',
        description: 'Install Level 2 EV charger in detached garage, run dedicated 240V circuit from main panel.',
        client: clients[0]._id,
        status: 'quote',
        priority: 'medium',
        location: {
          street: '123 Oak Street',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62701'
        },
        costs: {
          laborHours: 6,
          laborRate: 85,
          materials: [
            { name: 'Tesla Wall Connector', description: '48A charger', quantity: 1, unitPrice: 550, totalPrice: 550 },
            { name: '50A Circuit Breaker', description: 'Double pole', quantity: 1, unitPrice: 45, totalPrice: 45 },
            { name: 'Wire & Conduit', description: '6/3 NM cable', quantity: 1, unitPrice: 320, totalPrice: 320 },
            { name: 'Mounting Box', description: 'Weather resistant', quantity: 1, unitPrice: 35, totalPrice: 35 }
          ],
          equipment: [
            { name: 'Trenching Tools', cost: 50 }
          ],
          permitsCost: 100,
          subcontractorsCost: 200,
          otherCosts: 50,
          taxRate: 0.0825,
          discount: 0
        },
        payment: {
          method: 'check',
          depositAmount: 0,
          amountPaid: 0,
          terms: 'Due on completion'
        }
      }
    ];

    // Insert sample jobs
    console.log(`\nAdding ${sampleJobs.length} sample jobs...`);

    for (const jobData of sampleJobs) {
      try {
        // Generate job number
        const jobNumber = await Job.generateJobNumber();

        const job = new Job({
          ...jobData,
          jobNumber
        });

        await job.save();

        // Update client's jobs array
        await Client.findByIdAndUpdate(job.client, {
          $addToSet: { jobs: job._id }
        });

        console.log(`✓ Added: ${job.title} (${job.jobNumber})`);
      } catch (error) {
        console.log(`✗ Error adding ${jobData.title}: ${error.message}`);
      }
    }

    console.log('\n✅ Sample jobs added successfully!');
    console.log('\nYou can now:');
    console.log('1. View the Jobs page to see placeholder data');
    console.log('2. See completed jobs with actual expenses');
    console.log('3. Test expense recommendations based on completed jobs\n');

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addSampleJobs();
