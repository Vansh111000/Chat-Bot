import { GoogleGenAI } from "@google/genai";
import cors from "cors";
import dotenv from "dotenv";
import { eq } from "drizzle-orm";
import express, { Request, Response } from "express";
import { StreamChat } from "stream-chat";
import { db } from "./config/database.js";
import { chat, users } from './db/schema.js';

dotenv.config();

const app = express();

interface CustomUser {
    id: string;
    name: string;
    email: string;
    role: string;
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:false}));

// Initializing chat client
const chatClient = StreamChat.getInstance(
    process.env.STREAM_API_KEY!,
    process.env.STREAM_API_SECRET!
);
  

// Initializing gemini
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});


//register user with stream chat
app.post('/register-user', async (req : Request,res : Response):Promise<any>=>{
    const { name, email } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }

    try{
        const userId = email.replace(/[^a-zA-Z0-9_-]/g, '_');

        const userResponse = await chatClient.queryUsers({id: {$eq: userId}});

        if(!userResponse.users.length){
            // create user
            

            await chatClient.upsertUser({
                id: userId,
                name: name,
                email: email,
                role: 'user',
            } as CustomUser as any); 
        }

        //  Check for existing user on Database
        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.userId,userId));

        if(!existingUser.length){
            console.log(`User ${userId} does not exist in Database. Adding them...`);
            await db.insert(users).values({userId: userId,name:name, email: email});
        }

        res.status(200).json({userId, name , email});
    }catch(error){
        res.status(500).json({error: `Internal server error and ${error}`});
    }

});


app.post('/chat',async (req: Request, res:Response): Promise<any>=>{
const {message, userId} = req.body;

if(!message || !userId){
    return res.status(400).json({error: "Missing Message or UserId"});
}

try {
    // verify user exist
    const userResponse = await chatClient.queryUsers({id: userId});

    if(!userResponse.users.length){
        return res.status(404).json({error: "User not found"});
    }

    const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.userId, userId));

    if (!existingUser.length) {
        return res.status(404).json({error: "User not found in database. Please register first."});
    }

   const response = await ai.interactions.create({
    model:'gemini-3.5-flash-lite',
    input:message+" Give out just simple message without any special characters."
   })

    const aiMessage:string = response?.output_text ?? "no response from AI ";
    const modifiedRes = aiMessage.replace(/[*]/g, ' ')

    // saving chat to the database
    await db.insert(chat).values({ userId, message, reply: modifiedRes });

    // creating or get the channel for user to ai 
    const channel = chatClient.channel('messaging',`chat-${userId}`,{
        created_by_id: 'ai_bot',
    });

    await channel.create();
    await channel.sendMessage({ text: modifiedRes, user_id: 'ai_bot'});


    res.status(200).json({reply: aiMessage});
} catch (error) {
    console.log("Error generating AI response"+error)
    return res.status(500).json({error: "Internal Server error "+error})
}
});

// getting the chat history for the user
app.get('/get-messages', async (req: Request, res:Response): Promise<any> => {
    const {userId} = req.body;

    if(!userId){
        return res.status(400).json({error: "Error id is required."})
    }

    try {
        const chatHistory = await db
            .select()
            .from(chat)
            .where(eq(chat.userId,userId));
        
        res.status(200).json({message: chatHistory})  
    } catch (error) {
        console.log("Error fetching chat history : ",error);
        res.status(500).json({error: "Internal Server error"});
    }
})

const PORT = process.env.PORT || 5000;

app.listen(PORT, ()=> console.log(`Server running on ${PORT}`));