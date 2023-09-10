const { Bot, session } = require("grammy");
const { conversations, createConversation } = require("@grammyjs/conversations");

require('dotenv').config({ path: "./process.env" });

const bot = new Bot(process.env.BOT_TOKEN);

bot.use(session({
    initial() {
      // return empty object for now
      return {};
    },
}));

bot.use(conversations());
bot.use(createConversation(greeting));

async function greeting(conversation, ctx) {
    await ctx.reply("Hi there! What is your name?");
    const { message } = await conversation.wait();
    await ctx.reply(`Welcome to the chat, ${message.text}!`);
}

bot.command("start", async (ctx) => {
    await ctx.conversation.enter("greeting");
});

bot.hears('hi', (ctx) => ctx.reply(
    '<b>Hi!</b> <i>Welcome</i> to <a href="https://grammy.dev">grammY</a>.',
    { parse_mode: "HTML" }
))

bot.start()
console.log('Bot is launched')

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
