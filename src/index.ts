import { Bot, GrammyError, HttpError } from "grammy";
import { db } from "./db.js";
import { getLatestNews } from "./news.js";

const bot = new Bot(process.env.BOT_TOKEN!);

bot.command("start", async (ctx) => {
  const user = ctx.message?.from!;
  //add user to db
  const userDoc = db.collection("users").doc(user.id.toString());
  userDoc.set({
    firstname: user.first_name,
    lastname: user.last_name || "",
  });
});

bot.command("getUpdates", async (ctx) => {
  const user = ctx.message?.from;
  await dailyUpdate(user?.id!);
  console.log(`sent update to ${user?.first_name}`);
});

async function dailyUpdate(userId: number) {
  const updates = await getLatestNews();
  for (let i = 0; i < updates.length; i += 5) {
    const batch = updates.slice(i, i + 5).join('\n\n');
    console.log(`This is batch ${i+1}\n`,batch);
    await bot.api.sendMessage(userId, batch, {parse_mode: 'MarkdownV2'});
  }
}

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Could not contact Telegram:", e);
  } else {
    console.error("Unknown error:", e);
  }
});

bot.start();
