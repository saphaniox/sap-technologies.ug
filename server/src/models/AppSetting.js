const mongoose = require("mongoose");

const appSettingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 120
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  }
}, {
  timestamps: true
});

appSettingSchema.statics.getValue = async function getValue(key, fallback = null) {
  const setting = await this.findOne({ key }).lean();
  return setting ? setting.value : fallback;
};

appSettingSchema.statics.setValue = async function setValue(key, value, updatedBy = null) {
  return this.findOneAndUpdate(
    { key },
    { key, value, updatedBy },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();
};

module.exports = mongoose.model("AppSetting", appSettingSchema);
