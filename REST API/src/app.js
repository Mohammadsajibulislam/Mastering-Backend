//server create kora 
const express = require('express');

const app = express();
app.use(express.json()); // json data ke parse kora jate req.body te access kora jay


const notes = []
//POST /notes route create kora jate note create kora jay
app.post('/notes', (req, res) => {
    // console.log(req.body);
    notes.push(req.body);
    res.status(201).json({ 
        message: 'Note created successfully'
     });
})

//GET /notes route create kora jate note fetch kora jay
app.get('/notes', (req, res) => {

    res.status(200).json({
        message: 'Notes fetched successfully',
        notes: notes
    });

})

//DELETE /notes/:id route create kora jate note delete kora jay
app.delete('/notes/:index', (req, res) => {
       const index = req.params.index;

       delete notes[index];
       
       res.status(200).json({
        message: 'Note deleted successfully'
    })
})

//patch /notes/:id route create kora jate note update kora jay
app.patch('/notes/:index', (req, res) => {
    const index = req.params.index;
    const description = req.body.description;
    const title = req.body.title;

    notes[index].description = description;
    notes[index].title = title;

    res.status(200).json({
        message: 'Note updated successfully'
    })
})



module.exports = app; // app.js file ke export kora jate server.js file e import kora jay