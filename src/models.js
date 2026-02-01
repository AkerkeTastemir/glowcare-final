const mongoose = require('mongoose')

const quizProfileSchema = new mongoose.Schema({
    skinType: {
        type: String
    },
    concerns: {
        type: [String],
        default: []
    },
    preferences: {
        type: [String],
        default: []
    },
    completedAt: {
        type: Date
    },
}, { _id: false });


const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'email is necessary'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'please, enter valid email']
    },
    password: {
        type: String,
        required: [true, 'password is necessary']
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    username: {
        type: String,
        required: [true, 'username is necessary']
    },
    quizProfile: {
        type: quizProfileSchema,
        default: null
    },
    wishlist: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        }],
        default: []
    },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);

module.exports = {
  User,
  Product,
  Order
};
