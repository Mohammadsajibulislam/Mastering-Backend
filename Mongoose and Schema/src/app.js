//server create kora 
const express = require('express');
const noteModel = require('./models/note.model'); // note.model.js file ke import kora jate server.js file e use kora jay

const app = express();
app.use(express.json()); // json data ke parse kora jate req.body te access kora jay


 /**
  * POST /notes =>  route create kora jate note create kora jay
  * GET /notes  => route create kora jate shob note get kora jay
  * DELETE /notes/:id => route create kora jate note delete kora jay
  * PATCH /notes/:id => route create kora jate note update kora jay
  * 
  */

 //post /notes route create kora jate note create kora jay
 app.post('/notes',async (req, res) => {
    const data = req.body; // {title: 'note title', description: 'note description'
    await noteModel.create({
        title: data.title,
        description: data.description
    })
    res.status(201).send({
        message: 'Note created successfully'
    })
    
})

//Get /notes route create kora jate shob note get kora jay
app.get('/notes', async (req, res) => {
    const notes = await noteModel.find(); // shob note ke find kora jate get kora jay
    //find() method er maddome shob note find kora jay
    //findone() method er maddome specific note find kora jay

    res.status(200).send({
        message: 'Notes fetched successfully',
        data: notes
    })
})

//Delete /notes/:id route create kora jate note delete kora jay
app.delete('/notes/:id', async (req, res) => {
    const id = req.params.id; // note er id ke params theke access kora jate delete kora jay
    await noteModel.findByIdAndDelete({ _id: id }); // findByIdAndDelete() method er maddome specific note delete kora jay

    res.status(200).send({
        message: 'Note deleted successfully'
    })
})

//Patch /notes/:id route create kora jate note update kora jay
app.patch('/notes/:id', async (req, res) => {
    const id = req.params.id; // note er id ke params theke access kora jate update kora jay
    const description = req.body.description; // note er description ke body theke access kora jate update kora jay
    const title = req.body.title; // note er title ke body theke access kora jate update kora jay

    await noteModel.findByIdAndUpdate({ _id: id }, { title: title, description: description }); // findByIdAndUpdate() method er maddome specific note update kora jay


    res.status(200).send({
        message: 'Note updated successfully'
    })
})

module.exports = app; // app.js file ke export kora jate server.js file e import kora jay