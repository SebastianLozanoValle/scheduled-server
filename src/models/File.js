const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
    alias: String,
    tipo: String,
    filename: String,
    path: String,
});

const File = mongoose.model("File", FileSchema);

module.exports = { File, FileSchema };