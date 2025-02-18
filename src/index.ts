import { Bot } from "grammy";
import { db } from "./db.js";


const bot = new Bot(process.env.BOT_TOKEN!);
console.log("Hello world");

bot.command("start", async (ctx) => {
  // ctx.message.se
})