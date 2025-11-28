const mongoose = require('mongoose');


const CareerPathSchema = new mongoose.Schema({
  field: { type: String, required: true, unique: true },
  stages: [
    {
      title: { type: String, required: true },
      years: { type: String }, // e.g. "1-2 years", "3+ years"
      description: { type: String }
    }
  ],
  courses: [
    {
      name: { type: String, required: true },
      provider: { type: String },
      url: { type: String }
    }
  ]
});

module.exports = mongoose.model('CareerPath', CareerPathSchema);