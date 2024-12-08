import { PrismaClient } from "@prisma/client";
import express, { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

const prisma = new PrismaClient();
const app = express();
dotenv.config();

app.use(express.json());

const auth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers["authorization"];

    if (!token) {
      return res.status(401).json({ message: "Token is missing." });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    );

    if (decoded) {
      // @ts-ignore
      req.userId = decoded.id;

      next();
    } else {
      res.status(401).json({ message: "Please signin first" });
    }
  } catch (error) {
    res.status(401).json({ message: error });
  }
};


app.post("/signup", async(req, res)=>{
    try {
        const { username, password, firstName, lastName } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
          data: {
            username,
            password: hashedPassword,
            firstName,
            lastName,
          },
        });

        res.status(200).json({message: "User signed up successfully"});
    } catch (error) {
        res.status(500).json({message: error});
    }
    
});

app.post("/signin", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if(!user){
        res.status(401).json({message: "User does not exist!"});
    }

    const isValidPassword = user && bcrypt.compare(password, user.password);

    if(!isValidPassword){
        res.status(401).json({message: "Invalid Password"});
    }

    const token = jwt.sign({
        username: user?.username,
        id: user?.id
    }, process.env.JWT_SECRET as string);

    res.status(200).json({ token: token });
  } 
  
  catch (error) {
    res.status(500).json({ message: "An error occured during sign-in" });
  }
});

app.listen(3000,()=>{
    console.log("Server is running on port 3000");
});

//@ts-ignore
app.post("/createtodo", auth, async (req, res) => {
    try {
      const { title, description, done } = req.body;

      //@ts-ignore
      if (!req.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const todo = await prisma.todo.create({
        data: {
          title,
          description,
          done: done || false,
          //@ts-ignore
          userId: req.userId,
        },
      });

      res.json({ message: "Todo created successfully", todo });
    } catch (error) {
        res.status(500).json({message: "Error creating todo"});
        console.log(error);
    }
});

//@ts-ignore
app.get("/gettodo", auth, async (req, res) => {
  try {
    const showTodo = await prisma.todo.findFirst({
      where: {
        //@ts-ignore
        userId: req.userId,
      },
    });
    res.status(200).json({
        message: "Todo retrieved successfully",
        todo: showTodo,
    });

  } catch (error) {
    res.status(500).json({message: "Error while fetching todo"});
  }
});