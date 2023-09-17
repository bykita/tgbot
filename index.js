import { Bot, session, InlineKeyboard } from 'grammy';
import { conversations, createConversation } from '@grammyjs/conversations';
import FlibustaAPI from 'flibusta';
import { SocksProxyAgent } from 'socks-proxy-agent';
import tr from 'tor-request';
import dotenv from 'dotenv';

dotenv.config({ path: "./process.env" });

const bot = new Bot(process.env.BOT_TOKEN);

bot.use(session({
    initial() {
        return { page: 999 };
    },
}));

bot.use(conversations());
bot.use(createConversation(greeting));
bot.use(createConversation(searchBook));

async function greeting(conversation, ctx) {
    await ctx.reply("Hi there! What is your name?");
    const { message } = await conversation.wait();
    await ctx.reply(`Welcome to the chat, ${message.text}!`);
}

async function showBookList(ctx, flibustaApi, books, page = 0) {
    let booksStr = '';
    const inlineKeyboard = new InlineKeyboard()
    for (let i = 0; i < 5; i++) {
        const bookIdx = i + 5 * page;
        if (books.length - 1 < bookIdx) {
            break;
        }
        let cur = books[bookIdx];
        booksStr += `${i+1} 📖 <b>${cur.title}</b> (${cur.author [0].name})\n\n`;
        inlineKeyboard
            .text(i+1, 'book_' + bookIdx)
    }

    inlineKeyboard.row()

    if (page > 0) {
        inlineKeyboard.text('<', 'back')
    }

    if (5 * (page + 1) < books.length) {
        inlineKeyboard.text('>', 'forward');
    }

    await ctx.reply('Вот, что я нашёл:\n\n' + booksStr, { 
        parse_mode: "HTML",
        reply_markup: inlineKeyboard
    });
}

async function suggestBookDownload(ctx, book) {
    const inlineKeyboard = new InlineKeyboard();

    for (let download of book.downloads) {
        const type = download.link.split('/').pop();
        inlineKeyboard.text(type, 'download_' + type);
    }

    await ctx.reply('Выберите расширение', {
        reply_markup: inlineKeyboard
    });
}

async function searchBook(conversation, ctx) {
    tr.setTorAddress('127.0.0.1', '9050');
    const flibustaApi = new FlibustaAPI.default('http://flibustaongezhld6dibs2dps6vm4nvqg2kp7vgowbu76tzopgnhazqd.onion', {
        httpAgent: new SocksProxyAgent('socks5h://127.0.0.1:9050'),
    });

    await ctx.reply("Напишите название книги");

    const newCtx = await conversation.wait();

    const bookName = newCtx.message.text;
    let books = await flibustaApi.getBooksByNameFromOpds(bookName);

    newCtx.session.flibustaApi = flibustaApi;
    newCtx.session.books = books;
    newCtx.session.page = 0;

    await conversation.external(() => showBookList(newCtx, flibustaApi, books));
}

bot.callbackQuery("back", async (ctx) => {
    const {flibustaApi, books} = ctx.session;
    await showBookList(ctx, flibustaApi, books, --ctx.session.page);
    await ctx.answerCallbackQuery();
});

bot.callbackQuery("forward", async (ctx) => {
    const {flibustaApi, books} = ctx.session;
    await showBookList(ctx, flibustaApi, books, ++ctx.session.page);
    await ctx.answerCallbackQuery();
});

bot.on("callback_query:data", async (ctx) => {
    const {books} = ctx.session;
    const [callbackType, id] = ctx.callbackQuery.data.split('_');

    switch (callbackType) {
        case 'book':
            await suggestBookDownload(ctx, books[id])
            break;
        default:
            console.log("Unknown button event with payload", ctx.callbackQuery.data);
            break;
    }

    await ctx.answerCallbackQuery();
});

bot.command("start", async (ctx) => {
    await ctx.conversation.enter("greeting");
});

bot.command("book", async (ctx) => {
    await ctx.conversation.enter("searchBook");
});

bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    console.error("Error:", e);
});

bot.start()
console.log('Bot is launched')

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
