import express from "express";
import { ApolloError, ApolloServer } from "apollo-server-express";

import { typeDefs } from "./typeDefs.js";
import { resolvers } from "./resolvers.js";

import { connectDB } from "./db.js";

import cors from "cors";

export const app = express();

app.use(cors());

connectDB();

app.get("/", (req, res) => {
    res.send("Hello World!");
});

const start = async() => {

    const apolloServer = new ApolloServer({
        typeDefs,
        resolvers,
        context: async ({ req, res }) => {
            const auth = req ? req.headers.authorization : null;
            if (auth && auth.toLowerCase().startsWith("bearer ")) {
                const token = auth.substring(7);
                const { id } = jwt.verify(token, JWT_SECRET);
                const currentUser = await User.findById(id)
                return { currentUser };
            }
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
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    })
}

start();