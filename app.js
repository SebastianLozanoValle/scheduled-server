import express from "express";
import { ApolloServer } from "apollo-server-express";
import multer from 'multer';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import fs from 'fs';

import { typeDefs } from "./src/typeDefs.js";
import { resolvers } from "./src/resolvers.js";

import { connectDB } from "./src/db.js";

import cors from "cors";

import jwt from 'jsonwebtoken'
import { Specialist } from "./src/models/Specialist.js";
import { User } from "./src/models/User.js";

import bcrypt from 'bcryptjs';
import { Client } from "./src/models/Client.js";

const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

const JWT_SECRET = 'NEVER_SHARE_THIS'

export const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Comprueba si la carpeta 'files' existe y la crea si no existe
const dirPath = path.join(__dirname, 'files');
if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
}

// Configuración de multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, dirPath) // Aquí especificas el directorio donde se guardarán los archivos
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)) // Aquí puedes especificar el nombre del archivo
    }
});

const upload = multer({ storage });

// Configuración de CORS
const allowedOrigins = ['http://localhost:5173', 'https://vermillion-meringue-1bb547.netlify.app', 'http://localhost:5173'];

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            var msg = 'The CORS policy for this site does not ' +
                'allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
}));

connectDB();

app.get("/", (req, res) => {
    res.send("Hello World!");
});

// Endpoint para subir archivos
app.post('/upload', upload.single('file'), (req, res) => {
    // Aquí puedes manejar lo que sucede después de que el archivo se ha subido
    // Por ejemplo, podrías guardar la URL del archivo en tu base de datos
    res.json({ file: req.file });
});

const start = async () => {

    const apolloServer = new ApolloServer({
        typeDefs,
        resolvers,
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

    app.use("*", (req, res) => {
        res.status(404).json({
            error: "Not found"
        });
    });

    const port = process.env.PORT || 33402;
    app.listen(port, async () => {
        console.log(`Server is running on port ${port}`);

        // Busca un usuario con el rol de admin
        const adminUser = await User.findOne({ role: 'admin' });

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
                active: true
            });

            // Guarda el nuevo usuario en la base de datos
            await newAdminUser.save();

            console.log('Admin user created');
        }
    })
}

start();