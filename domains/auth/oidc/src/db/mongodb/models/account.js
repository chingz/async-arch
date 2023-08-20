const mongoose = require('mongoose');
const { Schema } = require('mongoose');
const omit = require('lodash/omit')

const AccountSchema = new Schema({
  username: {
    type: String,
    unique: true,
  },
  password: String,
  email: {
    type: String,
    unique: true,
  },
  role: {
    type: String,
    default: 'popug'
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
});

AccountSchema.statics.findByLogin = (username) => Account.findOne({ username });

AccountSchema.statics.findAccount = async (ctx, id) => {
  const account = await Account.findOne({ username: id });
  return (
    account && {
      accountId: id,
      async claims(_, scope) {
        if (!scope) return undefined;

        const openid = { sub: id };
        const email = {
          email: account.email,
          email_verified: account.emailVerified,
        };

        const accountInfo = account.asDomainModel();

        if (scope.includes("openid")) Object.assign(accountInfo, openid)
        if (scope.includes("email")) Object.assign(accountInfo, email)

        return accountInfo
      },
    }
  );
};

AccountSchema.methods.asDomainModel = function () {
  return omit(this._doc, ['_id', '__v', 'emailVerified', 'password']);
};

const Account = mongoose.model("Account", AccountSchema);

module.exports = Account;
