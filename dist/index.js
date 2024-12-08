"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
dotenv_1.default.config();
app.use(express_1.default.json());
const auth = (req, res, next) => {
    try {
        const token = req.headers["authorization"];
        if (!token) {
            return res.status(401).json({ message: "Token is missing." });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (decoded) {
            // @ts-ignore
            req.userId = decoded.id;
            next();
        }
        else {
            res.status(401).json({ message: "Please signin first" });
        }
    }
    catch (error) {
        res.status(401).json({ message: error });
    }
};
app.post("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password, firstName, lastName } = req.body;
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const user = yield prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                firstName,
                lastName,
            },
        });
        res.status(200).json({ message: "User signed up successfully" });
    }
    catch (error) {
        res.status(500).json({ message: error });
    }
}));
app.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        const user = yield prisma.user.findUnique({
            where: { username },
        });
        if (!user) {
            res.status(401).json({ message: "User does not exist!" });
        }
        const isValidPassword = user && bcrypt_1.default.compare(password, user.password);
        if (!isValidPassword) {
            res.status(401).json({ message: "Invalid Password" });
        }
        const token = jsonwebtoken_1.default.sign({
            username: user === null || user === void 0 ? void 0 : user.username,
            id: user === null || user === void 0 ? void 0 : user.id
        }, process.env.JWT_SECRET);
        res.status(200).json({ token: token });
    }
    catch (error) {
        res.status(500).json({ message: "An error occured during sign-in" });
    }
}));
app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
//@ts-ignore
app.post("/createtodo", auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description, done } = req.body;
        //@ts-ignore
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const todo = yield prisma.todo.create({
            data: {
                title,
                description,
                done: done || false,
                //@ts-ignore
                userId: req.userId,
            },
        });
        res.json({ message: "Todo created successfully", todo });
    }
    catch (error) {
        res.status(500).json({ message: "Error creating todo" });
        console.log(error);
    }
}));
//@ts-ignore
app.get("/gettodo", auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const showTodo = yield prisma.todo.findFirst({
            where: {
                //@ts-ignore
                userId: req.userId,
            },
        });
        res.status(200).json({
            message: "Todo retrieved successfully",
            todo: showTodo,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Error while fetching todo" });
    }
}));
