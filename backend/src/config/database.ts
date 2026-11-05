import {neon} from '@neondatabase/serverless'
import {drizzle} from "drizzle-orm/neon-http"
import { config } from 'dotenv'
import { error } from 'node:console'

// loading environment variables
config({path: '.env'})

if(!process.env.DATABASE_URL){
    throw new Error("DATABASE_URL is undefined");
}

// init the neon client
const sql = neon(process.env.DATABASE_URL);

// init the drizzle 
export const db = drizzle(sql);