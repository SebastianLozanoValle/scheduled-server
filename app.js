import express from "express";
import { ApolloServer } from "apollo-server-express";

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

// Middleware para configurar CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://vermillion-meringue-1bb547.netlify.app, localhost:5173');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use(cors());

connectDB();

app.get("/", (req, res) => {
    res.send("Hello World!");
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
        }
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