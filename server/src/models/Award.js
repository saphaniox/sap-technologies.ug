const mongoose = require("mongoose");

const awardCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Category name is required"],
        trim: true
    },
    description: {
        type: String,
        required: [true, "Category description is required"],
        trim: true
    },
    icon: {
        type: String,
        default: "🏆"
    },
    iconName: {
        type: String,
        default: "trophy",
        enum: [
            "trophy", "star", "medal", "crown", "rocket", "lightbulb",
            "heart", "users", "globe", "flag", "chart", "shield",
            "target", "briefcase", "sparkles", "check", "clock", "ballot"
        ]
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const nominationSchema = new mongoose.Schema({
    // Nominee Information
    nomineeName: {
        type: String,
        required: [true, "Nominee name is required"],
        trim: true,
        maxlength: [100, "Nominee name cannot exceed 100 characters"]
    },
    nomineePhoto: {
        type: String,
        required: [true, "Nominee photo is required"]
    },
    nomineeTitle: {
        type: String,
        trim: true,
        maxlength: [150, "Nominee title cannot exceed 150 characters"]
    },
    nomineeCompany: {
        type: String,
        trim: true,
        maxlength: [100, "Company name cannot exceed 100 characters"]
    },
    nomineeCountry: {
        type: String,
        required: [true, "Nominee country is required"],
        trim: true,
        default: "Uganda"
    },
    
    // Nomination Details
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AwardCategory",
        required: [true, "Award category is required"]
    },
    nominationReason: {
        type: String,
        required: [true, "Nomination reason is required"],
        trim: true,
        minlength: [50, "Nomination reason must be at least 50 characters"],
        maxlength: [1000, "Nomination reason cannot exceed 1000 characters"]
    },
    achievements: {
        type: String,
        trim: true,
        maxlength: [1500, "Achievements cannot exceed 1500 characters"]
    },
    impactDescription: {
        type: String,
        trim: true,
        maxlength: [1000, "Impact description cannot exceed 1000 characters"]
    },
    
    // Nominator Information
    nominatorName: {
        type: String,
        required: [true, "Nominator name is required"],
        trim: true,
        maxlength: [100, "Nominator name cannot exceed 100 characters"]
    },
    nominatorEmail: {
        type: String,
        required: [true, "Nominator email is required"],
        lowercase: true,
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email"]
    },
    nominatorPhone: {
        type: String,
        trim: true,
        match: [/^[\+]?[0-9\s\-\(\)]{10,15}$/, "Please provide a valid phone number"]
    },
    nominatorOrganization: {
        type: String,
        trim: true,
        maxlength: [100, "Organization name cannot exceed 100 characters"]
    },
    
    // Status and Voting
    status: {
        type: String,
        enum: {
            values: ["pending", "approved", "rejected", "winner", "finalist"],
            message: "Status must be pending, approved, rejected, winner, or finalist"
        },
        default: "pending"
    },
    votes: {
        type: Number,
        default: 0,
        min: 0
    },
    publicVotes: [{
        voterEmail: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },
        voterName: String,
        votedAt: {
            type: Date,
            default: Date.now
        },
        ipAddress: String
    }],
    
    // Admin Notes
    adminNotes: {
        type: String,
        trim: true,
        maxlength: [500, "Admin notes cannot exceed 500 characters"]
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    reviewedAt: Date,
    
    // SEO and Display
    slug: {
        type: String
    },
    featured: {
        type: Boolean,
        default: false
    },
    displayOrder: {
        type: Number,
        default: 0
    },
    
    // Certificate Information
    certificateId: {
        type: String,
        unique: true,
        sparse: true
    },
    certificateFile: {
        type: String
    },
    certificateUrl: {
        type: String,
        default: null
    },
    certificateCloudinaryId: {
        type: String,
        default: null
    },
    certificateGeneratedAt: {
        type: Date
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for total votes count
nominationSchema.virtual("totalVotes").get(function() {
    return this.publicVotes.length;
});

// Virtual for nominee full display name
nominationSchema.virtual("nomineeDisplayName").get(function() {
    let displayName = this.nomineeName;
    if (this.nomineeTitle) {
        displayName += ` - ${this.nomineeTitle}`;
    }
    if (this.nomineeCompany) {
        displayName += ` at ${this.nomineeCompany}`;
    }
    return displayName;
});

// Pre-save middleware to generate slug
nominationSchema.pre("save", function(next) {
    if (this.isModified("nomineeName") || !this.slug) {
        this.slug = this.nomineeName
            .toLowerCase()
            .replace(/[^a-zA-Z0-9\s]/g, "")
            .replace(/\s+/g, "-")
            .substring(0, 50) + "-" + Date.now();
    }
    next();
});

// Pre-save middleware to update votes count
nominationSchema.pre("save", function(next) {
    this.votes = this.publicVotes.length;
    next();
});

// Static method to get nominations by category
nominationSchema.statics.getByCategoryWithStats = async function(categoryId, status = "approved") {
    return this.aggregate([
        {
            $match: {
                category: mongoose.Types.ObjectId(categoryId),
                status: status
            }
        },
        {
            $lookup: {
                from: "awardcategories",
                localField: "category",
                foreignField: "_id",
                as: "categoryInfo"
            }
        },
        {
            $addFields: {
                totalVotes: { $size: "$publicVotes" },
                categoryName: { $arrayElemAt: ["$categoryInfo.name", 0] }
            }
        },
        {
            $sort: { votes: -1, createdAt: -1 }
        }
    ]);
};

// Instance method to add vote
nominationSchema.methods.addVote = function(voterData) {
    // Check if email already voted
    const existingVote = this.publicVotes.find(vote => vote.voterEmail === voterData.voterEmail);
    if (existingVote) {
        throw new Error("This email has already voted for this nomination");
    }
    
    this.publicVotes.push({
        voterEmail: voterData.voterEmail,
        voterName: voterData.voterName,
        ipAddress: voterData.ipAddress,
        votedAt: new Date()
    });
    
    return this.save();
};

// Instance method to check if email has voted
nominationSchema.methods.hasVoted = function(email) {
    return this.publicVotes.some(vote => vote.voterEmail === email.toLowerCase());
};

// Indexes for performance optimization - AwardCategory
awardCategorySchema.index({ isActive: 1, name: 1 }); // Active categories lookup

// Indexes for performance optimization - Nomination
nominationSchema.index({ category: 1, status: 1 }); // Category + status filtering
nominationSchema.index({ status: 1, votes: -1 }); // Status with vote sorting (leaderboard)
nominationSchema.index({ votes: -1 }); // Top voted nominations (createdAt already indexed by timestamps)
nominationSchema.index({ featured: -1, displayOrder: 1 }); // Featured nominations display
nominationSchema.index({ slug: 1 }, { unique: true, sparse: true }); // SEO slug lookup
nominationSchema.index({ nominatorEmail: 1 }); // Nominator's submissions
nominationSchema.index({ nomineeCountry: 1 }); // Country filtering
nominationSchema.index({ "publicVotes.voterEmail": 1 }); // Vote duplicate checking
nominationSchema.index({ nomineeName: "text", nominationReason: "text", achievements: "text" }); // Text search

const AwardCategory = mongoose.model("AwardCategory", awardCategorySchema);
const Nomination = mongoose.model("Nomination", nominationSchema);

module.exports = {
    AwardCategory,
    Nomination
};