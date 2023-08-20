const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
    },
    role: {
        type: String,
        required: true,
    },
});

UserSchema.statics.getWorkers = () => User.find({ role: { $nin: ['admin', 'manager'] } }).exec();

const User = mongoose.model("User", UserSchema);

module.exports = User;
