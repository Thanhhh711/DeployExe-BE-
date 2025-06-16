const moogoose = require("mongoose");
const serviceSchema = new moogoose.Schema({
  name: {
    type: String,
    required: true,
    uinique: true,
  },
  price: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  // image: {
  //     type: String,
  //     required: true,
  // },
  createdAt: { type: Date, default: Date.now },
});
const Service = moogoose.model("Service", serviceSchema);
module.exports = Service;
