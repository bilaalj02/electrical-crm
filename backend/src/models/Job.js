const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  // Job Identification
  jobNumber: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,

  // Client Information
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },

  // Job Location (may differ from client address)
  location: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },

  // Job Status
  status: {
    type: String,
    enum: ['quote', 'approved', 'scheduled', 'in-progress', 'completed', 'invoiced', 'paid', 'cancelled'],
    default: 'quote'
  },

  // Dates
  quoteDate: Date,
  approvalDate: Date,
  scheduledDate: Date,
  startDate: Date,
  completionDate: Date,
  dueDate: Date,

  // Financial Information
  costs: {
    // Labor Costs
    laborHours: {
      type: Number,
      default: 0
    },
    laborRate: {
      type: Number,
      default: 85 // Default hourly rate
    },
    laborTotal: {
      type: Number,
      default: 0
    },

    // Materials
    materials: [{
      name: String,
      description: String,
      quantity: Number,
      unitPrice: Number,
      totalPrice: Number
    }],
    materialsTotal: {
      type: Number,
      default: 0
    },

    // Equipment/Tools
    equipment: [{
      name: String,
      cost: Number
    }],
    equipmentTotal: {
      type: Number,
      default: 0
    },

    // Other costs
    permitsCost: {
      type: Number,
      default: 0
    },
    subcontractorsCost: {
      type: Number,
      default: 0
    },
    otherCosts: {
      type: Number,
      default: 0
    },

    // Totals
    subtotal: {
      type: Number,
      default: 0
    },
    taxRate: {
      type: Number,
      default: 0 // As decimal (e.g., 0.0825 for 8.25%)
    },
    tax: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    finalTotal: {
      type: Number,
      default: 0
    }
  },

  // Payment Information
  payment: {
    method: {
      type: String,
      enum: ['cash', 'check', 'credit-card', 'bank-transfer', 'other'],
      default: 'check'
    },
    depositAmount: {
      type: Number,
      default: 0
    },
    depositPaid: {
      type: Boolean,
      default: false
    },
    depositDate: Date,
    amountPaid: {
      type: Number,
      default: 0
    },
    balance: {
      type: Number,
      default: 0
    },
    paidInFull: {
      type: Boolean,
      default: false
    },
    finalPaymentDate: Date
  },

  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  // Team Assignment
  assignedTo: [{
    name: String,
    role: String
  }],

  // Related Emails
  relatedEmails: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Email'
  }],

  // Documents/Photos
  documents: [{
    name: String,
    type: String,
    url: String,
    uploadedAt: Date
  }],

  // Notes/Comments
  notes: [{
    text: String,
    author: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Internal Notes
  internalNotes: String
}, {
  timestamps: true
});

// Indexes for efficient querying
jobSchema.index({ jobNumber: 1 });
jobSchema.index({ client: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ priority: 1 });
jobSchema.index({ scheduledDate: 1 });
jobSchema.index({ 'costs.finalTotal': -1 }); // For sorting by payment amount

// Pre-save middleware to calculate totals
jobSchema.pre('save', function(next) {
  // Calculate labor total
  this.costs.laborTotal = this.costs.laborHours * this.costs.laborRate;

  // Calculate materials total
  this.costs.materialsTotal = this.costs.materials.reduce((sum, item) => {
    return sum + (item.totalPrice || 0);
  }, 0);

  // Calculate equipment total
  this.costs.equipmentTotal = this.costs.equipment.reduce((sum, item) => {
    return sum + (item.cost || 0);
  }, 0);

  // Calculate subtotal
  this.costs.subtotal =
    this.costs.laborTotal +
    this.costs.materialsTotal +
    this.costs.equipmentTotal +
    this.costs.permitsCost +
    this.costs.subcontractorsCost +
    this.costs.otherCosts;

  // Calculate tax
  this.costs.tax = this.costs.subtotal * this.costs.taxRate;

  // Calculate total
  this.costs.total = this.costs.subtotal + this.costs.tax;

  // Calculate final total (after discount)
  this.costs.finalTotal = this.costs.total - this.costs.discount;

  // Calculate payment balance
  this.payment.balance = this.costs.finalTotal - this.payment.amountPaid;
  this.payment.paidInFull = this.payment.balance <= 0;

  next();
});

// Method to generate job number
jobSchema.statics.generateJobNumber = async function() {
  const year = new Date().getFullYear();
  const prefix = `JOB-${year}-`;

  // Find the latest job number for this year
  const lastJob = await this.findOne({
    jobNumber: { $regex: `^${prefix}` }
  }).sort({ jobNumber: -1 });

  let nextNumber = 1;
  if (lastJob) {
    const lastNumber = parseInt(lastJob.jobNumber.split('-')[2]);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
};

module.exports = mongoose.model('Job', jobSchema);
