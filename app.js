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

const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

const JWT_SECRET = 'NEVER_SHARE_THIS'

const app = express();
module.exports = app;

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// Comprueba si la carpeta 'files' existe y la crea si no existe
// const dirPath = path.join(__dirname, 'files');
// if (!fs.existsSync(dirPath)) {
//     fs.mkdirSync(dirPath);
// }
// throw new Error(`An error occurred with directory: ${dirPath}`);
// Configuración de multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './files') // Aquí especificas el directorio donde se guardarán los archivos
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)) // Aquí puedes especificar el nombre del archivo
    }
});

const upload = multer({ storage });

// app.use(function (req, res, next) {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
//     next();
// });

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
    app.post('/upload', upload.single('file'), (req, res) => {
        // Aquí puedes manejar lo que sucede después de que el archivo se ha subido
        // Por ejemplo, podrías guardar la URL del archivo en tu base de datos
        res.json({ file: req.file });
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
        // const adminUser = await User.findOne({ role: 'admin'.toLowerCase() });

        // // Si no existe un usuario con el rol de admin...
        // if (!adminUser) {
        //     // Crea un nuevo usuario con el rol de admin
        //     const hashedPassword = await hashPassword('password'); // Asegúrate de encriptar la contraseña en un caso real
        //     const newAdminUser = new User({
        //         username: 'admin',
        //         password: hashedPassword,
        //         age: 30,
        //         gender: 'male',
        //         phone: '1234567890',
        //         email: 'admin@example.com',
        //         city: 'City',
        //         street: 'Street',
        //         role: 'admin',
        //         active: true
        //     });

        //     // Guarda el nuevo usuario en la base de datos
        //     await newAdminUser.save();

        //     console.log('Admin user created');
        // }
    })
}

start();