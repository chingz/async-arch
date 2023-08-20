const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    balance: {
        type: Number,
        default: 0,
    },
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
    payroll: [new mongoose.Schema({
        date: Date,
        amount: Number,
    })]
});

UserSchema.statics.getByUsername = (username) => User.findOne({ username }).exec();

UserSchema.statics.payroll = async (usersBalance, sendUserEmail) => {
    for (let username of Object.keys(usersBalance)) {
        const user = await User.findOne({ username }).exec();
        const earnedSum = usersBalance[username];

        console.log('running payroll', user.username, earnedSum);

        if (earnedSum > 0) {
            user.balance = 0;
            user.payroll.push({ date: Date.now(), amount: earnedSum })

            await sendUserEmail(user);
        }
        await user.save();
    }
}

const User = mongoose.model("User", UserSchema);

module.exports = User;
