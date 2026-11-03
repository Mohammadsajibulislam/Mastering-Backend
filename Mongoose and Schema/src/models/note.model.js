const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    title: String,
    description: String    
});


// Crud operation er jonno model ke export kora jate onno file e use kora jay
const noteModel = mongoose.model('Note', noteSchema);

module.exports = noteModel; // model ke export kora jate onno file e use kora jay


