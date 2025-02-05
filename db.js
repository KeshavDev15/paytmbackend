// backend/db.js
const mongoose = require('mongoose');

mongoose.connect(connectionURL);
// Create a Schema for Users
const userSchema = new mongoose.Schema({
    username: {
        type: String,
    },
    password: {
        type: String,
    },
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    }
});

const accountSchema = new mongoose.Schema ({
    userId : {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required : true
    },
    balance : {
        type : Number,
        required : true
    }
})

// Create a model from the schema
const User = mongoose.model('User', userSchema);
const Account = mongoose.model('Account',accountSchema);

module.exports = {
	User,Account
};
