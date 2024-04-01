const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const multer = require('multer');
const path = require("path");

const typeDefs = require("./src/typeDefs.js");
const resolvers = require("./src/resolvers.js");

const connectDB = require("./src/db.js");

const cors = require("cors");

const jwt = require('jsonwebtoken');
const { Specialist } = require("./src/models/Specialist.js");
const { User } = require("./src/models/User.js");

const bcrypt = require('bcryptjs');
const { Client } = require("./src/models/Client.js");
const { File } = require('./src/models/File.js');

const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

const JWT_SECRET = 'NEVER_SHARE_THIS'

const app = express();
module.exports = app;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './files')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
})

const upload = multer({ storage });

connectDB();

const start = async () => {

    const apolloServer = new ApolloServer({
        typeDefs,
        resolvers,
        cache: 'bounded',
        context: async ({ req, res }) => {
            const auth = req ? req.headers.authorization : null;
            if (auth && auth.toLowerCase().startsWith("bearer ")) {
                const token = auth.substring(7);
                const { id } = jwt.verify(token, JWT_SECRET);
                let currentUser = await Specialist.findById(id)
                if (!currentUser) {
                    currentUser = await Client.findById(id)
                    if (!currentUser) {
                        currentUser = await User.findById(id)
                    }
                }
                return { currentUser };
            }
            return {};
        },
        connectToDevTools: true
    });

    await apolloServer.start();

    apolloServer.applyMiddleware({ app: app });


    app.use(cors());

    app.get("/", (req, res) => {
        res.send("Hello World!");
    });

    // Endpoint para subir archivos
    app.post('/upload', upload.single('file'), async (req, res) => {
        const absolutePath = path.resolve(req.file.path);

        const newFile = new File({
            filename: req.file.filename,
            path: absolutePath,
        });

        const savedFile = await newFile.save();

        res.json({ file: req.file, id: savedFile._id });
    });

    app.get('/files/:filename', async (req, res) => {
        const file = await File.findOne({ filename: req.params.filename });

        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.sendFile(file.path);
    });

    app.delete('/eliminar-archivo/:nombreArchivo', (req, res) => {
        const nombreArchivo = req.params.nombreArchivo;

        // Verificar si el archivo existe
        fs.access(`directorio_de_tus_archivos/${nombreArchivo}`, fs.constants.F_OK, (err) => {
            if (err) {
                return res.status(404).json({ mensaje: 'El archivo no existe.' });
            }

            // Si el archivo existe, eliminarlo
            fs.unlink(`directorio_de_tus_archivos/${nombreArchivo}`, (err) => {
                if (err) {
                    return res.status(500).json({ mensaje: 'Error al eliminar el archivo.' });
                }
                res.status(200).json({ mensaje: 'Archivo eliminado exitosamente.' });
            });
        });
    });

    app.use("*", (req, res) => {
        res.status(404).json({
            error: "Not found"
        });
    });

    const port = process.env.PORT || 33402;
    app.listen(port, async () => {
        console.log(`Server is running on port ${port}`);

        // Busca un usuario con el rol de admin
        const adminUser = await User.findOne({ role: 'admin'.toLowerCase() });

        // Si no existe un usuario con el rol de admin...
        if (!adminUser) {
            // Crea un nuevo usuario con el rol de admin
            const hashedPassword = await hashPassword('password'); // Asegúrate de encriptar la contraseña en un caso real
            const newAdminUser = new User({
                username: 'admin',
                password: hashedPassword,
                age: 30,
                gender: 'male',
                phone: '1234567890',
                email: 'admin@example.com',
                city: 'City',
                street: 'Street',
                role: 'admin',
                active: true,
                notifications: [],
                files: [],
            });

            // Guarda el nuevo usuario en la base de datos
            await newAdminUser.save();

            console.log('Admin user created');
        }
    })
}

start();