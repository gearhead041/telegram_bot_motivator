import { Bot, Context, GrammyError, HttpError } from "grammy";
import { db } from "./db.js";
import { getLatestNews } from "./news.js";
import { User } from "grammy/types";
import {
  Conversation,
  type ConversationFlavor,
  conversations,
  createConversation,
} from "@grammyjs/conversations";

const bot = new Bot<ConversationFlavor<Context>>(process.env.BOT_TOKEN!);
bot.use(conversations());
const SEND_LIMIT = 5;

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

async function setLimit(conversation: Conversation, ctx: Context) {
  await ctx.reply(
    "Respond with the number of messages you want to be sent (Max. 20)"
  );
  const { message } = await conversation.waitFor("message:text");
  const num = parseInt(message.text);
  if (!num || num > 20) {
    await ctx.reply("Please a valid number.");
  }

  const userRef = db.collection("users").doc(ctx.from?.id.toString()!);
  await userRef.set(
    {
      send_limit: num,
    },
    { merge: true }
  );
  ctx.reply("Your settings have been updated");
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
});

async function registerUser(user: User) {
  const userDoc = db.collection("users").doc(user.id.toString());
  await userDoc.set({
    firstname: user.first_name,
    lastname: user.last_name || "",
    send_limit: SEND_LIMIT,
  });

  return userDoc;
}
//rework this !
setInterval(async () => {
  let news = await getLatestNews();
  await pushNewsUpdates(news);
  console.log('Sent global update');
}, 12 * 60 * 60 * 1000);

async function pushNewsUpdates(news: string[]) {
  const users = await db.collection("users").get();
  users.forEach(async (user: any) => {
    await bot.api.sendMessage(
      user.id,
      "Hello and good day here's the latest news!! 🗞️"
    );
    for (let i = 0; i < user.send_limit; i++) {
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

bot.start();
