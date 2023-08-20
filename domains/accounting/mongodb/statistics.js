const mongoose = require('mongoose');

const StatisticsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    value: {
        type: Number,
        required: true,
        default: 0,
    },
    date: {
        type: Date,
        default: Date.now,
        required: true,
    },
});

const Statistics = mongoose.model("Statistics", StatisticsSchema);

module.exports = Statistics;
