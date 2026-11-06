const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: true,
            minlength: 6
        }
    },
    { timestamps: true }
);

const userModel = mongoose.model('user', userSchema);

module.exports = userModel;



/** 
 * - `unique: true`: একই email/username দুইজন নিতে পারবে না।
 * - `lowercase: true`: `Sajib@Gmail.com` আর `sajib@gmail.com` একই।
 * - `timestamps: true`: `createdAt`, `updatedAt` নিজে বসে। 
 * 
*/


//Model হলো MongoDB-তে কোন ধরনের ডেটা থাকবে এবং সেই ডেটা দিয়ে কী কাজ করা যাবে—তার জন্য Mongoose-এ বানানো কাঠামো ও interface। 
// আপনার user.model.js-এ: Schema (userSchema) বলে দেয় user-এর username, email, password কী ধরনের হবে এবং কোনগুলো বাধ্যতামূলক। Model (userModel) ওই schema ব্যবহার করে MongoDB-তে user তৈরি, খোঁজা, আপডেট বা মুছতে দেয়। 
//সহজভাবে: Schema = ডেটার নিয়ম, Model = সেই নিয়ম মেনে ডেটার সঙ্গে কাজ করার মাধ্যম। Mongoose-এ mongoose.model('user', userSchema) দিয়ে model তৈরি হয়েছে।