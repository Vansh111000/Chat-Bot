 import { pgTable, text, timestamp, integer
  } from "drizzle-orm/pg-core";
 
 export const chat = pgTable("chats",{
    id: integer("id").generatedByDefaultAsIdentity().primaryKey(), //the name will be used in code: serialor anything("the name will be there in postgre sql")
    userId: text('user_id').notNull(),
    message: text('message').notNull(),
    reply: text('reply').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull()
 });

 export const users = pgTable("users", {
    userId: text('user_id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
 })


//  type inference for drizzle queries
export type ChatInsert = typeof chat.$inferInsert;
export type ChatSelect = typeof chat.$inferSelect;
export type UserInsert = typeof users.$inferSelect;
export type UserSelect = typeof users.$inferSelect;