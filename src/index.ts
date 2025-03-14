import { Bot, Context, GrammyError, HttpError } from "grammy";
import { db } from "./db.js";
import { getLatestNews, getTopStories } from "./news.js";
import { User } from "grammy/types";
import {
  Conversation,
  type ConversationFlavor,
  conversations,
  createConversation,
} from "@grammyjs/conversations";
import { CronJob } from "cron";

const SEND_LIMIT = 10;
const bot = new Bot<ConversationFlavor<Context>>(process.env.BOT_TOKEN!);
bot.use(conversations());

bot.command("start", async (ctx) => {
  const user = ctx.message?.from!;
  await registerUser(user);
  bot.api.sendMessage(
    user.id,
    `Hello there ${user.first_name}! I'll be sending you daily updates on Punch News!\n
    You can also use the command \\getUpdates to get the latest on demand. \n
    To set the limit for how many news articles I should send you, use the \\setlimit command.
    `
  );
});

async function registerUser(user: User) {
  const userDoc = db.collection("users").doc(user.id.toString());
  const userStored = await userDoc.get();
  if (!userStored.exists) {
    await userDoc.set({
      firstname: user.first_name,
      lastname: user.last_name || "",
      send_limit: SEND_LIMIT,
    });
    console.log(`registered ${user.id}`);
  }
}

async function setLimit(conversation: Conversation, ctx: Context) {
  const userRef = db.collection("users").doc(ctx.from?.id.toString()!);
  const user = await userRef.get();
  await ctx.reply(
    `Respond with the number of messages you want to be sent (Max. 25)\nCurrent limit is ${
      user.data()!.send_limit
    }`
  );
  const { message } = await conversation.waitFor("message:text");
  const num = parseInt(message.text);
  if (!num || num > SEND_LIMIT) {
    await ctx.reply("Please try again with a valid number.");
    return;
  }

  await userRef.set(
    {
      send_limit: num,
    },
    { merge: true }
  );
  ctx.reply("Your settings have been updated");
  console.log(`Updated settings for ${ctx.from?.id}`);
}

bot.use(createConversation(setLimit));

bot.command("setlimit", async (ctx) => {
  await ctx.conversation.enter("setLimit");
});

bot.command("getupdates", async (ctx) => {
  let dbUser = await db.collection("users").doc(ctx.from!.id.toString()).get();
  const news = await getLatestNews();

  for (let i = 0; i < dbUser.data()!.send_limit; i++) {
    await bot.api.sendMessage(ctx.from!.id, news[i], {
      parse_mode: "MarkdownV2",
    });
  }
  console.log(`Sent instant updates to ${ctx.from!.id}`);
});

async function pushNewsUpdates() {
  const news = await getLatestNews();
  const users = await db.collection("users").get();
  users.forEach(async (user) => {
    await bot.api.sendMessage(
      user.id,
      "Hello and good day here's the latest news!! 🗞️"
    );
    for (let i = 0; i < user.data().send_limit; i++) {
      await bot.api.sendMessage(user.id, news[i], {
        parse_mode: "MarkdownV2",
      });
    }
  });
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

const job = new CronJob(
  "0 0 9,21 * * *",
  async () => pushNewsUpdates(),
  null,
  true,
  "Africa/Lagos"
);

bot.start();
