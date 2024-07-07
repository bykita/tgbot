import { Bot, session, InlineKeyboard, InputFile } from 'grammy';
import { conversations, createConversation } from '@grammyjs/conversations';
import FlibustaAPI from 'flibusta';
import { SocksProxyAgent } from 'socks-proxy-agent';
import tr from 'tor-request';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';
import unzipper from 'unzipper';
import * as uuid from 'uuid';

dotenv.config({ path: "./process.env" });

const URL = 'http://flibustaongezhld6dibs2dps6vm4nvqg2kp7vgowbu76tzopgnhazqd.onion'

const bot = new Bot(process.env.BOT_TOKEN);

bot.use(session({
    initial() {
        return { page: 999 };
    },
}));

bot.use(conversations());
bot.use(createConversation(searchBook));

/**
 * Функция вызова промпта для поиска книги
 * и поиска, с последующим выводом списка книг
 * @param {*} conversation Объект для общения с пользователем
 * @param {*} ctx Контекст общения с ботом
 */
async function searchBook(conversation, ctx) {
    await ctx.reply("Напишите название книги");

    const newCtx = await conversation.wait();
    await newCtx.reply("Запуск поиска...");

    const bookName = newCtx.message.text;
    console.log(`Searching "${bookName}"`);
    let books = await flibustaApi.getBooksByNameFromOpds(bookName);

    newCtx.session.flibustaApi = flibustaApi;
    newCtx.session.books = books;
    newCtx.session.page = 0;

    await conversation.external(() => showBookList(newCtx, books));
}

/**
 * Функция отображения списка найденных книг по промпту
 * @param {*} ctx Контекст общения с ботом
 * @param {Object[]} books Массив с найденными книгами
 * @param {number} page Страница
 */
async function showBookList(ctx, books, page = 0) {
    if (!books) {
        await ctx.reply('Книги не найдены :(');
        await ctx.conversation.enter("searchBook");
        return;
    }

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

/**
 * Функция вызова промпта для формата скачиваемой книги
 * @param {*} ctx Контекст общения с ботом
 * @param {object} book Информация о выбранной книге
 */
async function suggestBookDownload(ctx, book) {

    function strip(str){
        return str
            .replace(/<br\/>/gm, '\n')
            .replace(/<[^>]*>?/gm, '');
    }

    const imageUUID = uuid.v4();
    const imagePath = `files/${imageUUID}.${book.cover.split('.').pop()}`;

    const fileStream = fs.createWriteStream(imagePath);
    const res = await fetch(URL + book.cover, {
        agent,
        headers: {
            'Content-Type': "image/xyz"
        }
    })
    await new Promise((resolve, reject) => {
        res.body.pipe(fileStream);
        res.body.on("error", reject);
        fileStream.on("finish", resolve);
    });

    await ctx.replyWithPhoto(new InputFile(imagePath));
    await ctx.reply(strip(book.description));

    const inlineKeyboard = new InlineKeyboard();

    ctx.session.book = book;

    for (let download of book.downloads) {
        const type = download.link.split('/').pop();
        inlineKeyboard.text(type, 'download_' + type);
    }

    await ctx.reply('Выберите расширение', {
        reply_markup: inlineKeyboard
    });
}

/**
 * Функция скачивания книги
 * @param {*} ctx Контекст общения с ботом
 * @param {Object} book Книга
 * @param {string} ext Выбранное разрешение файла
 */
async function downloadBook(ctx, book, ext) {
    await ctx.reply(`Начинаю скачивание книги ${book.title}`);

    const {link, type} = book.downloads.find(obj => obj.link.endsWith(ext));

    const fileUUID = uuid.v4();
    const filePath = `files/${fileUUID}.zip`;

    console.log('Downloading book');

    const fileStream = fs.createWriteStream(filePath);
    const res = await fetch(URL + link, {
        agent,
        headers: {
            'Content-Type': type
        }
    })
    await new Promise((resolve, reject) => {
        res.body.pipe(fileStream);
        res.body.on("error", reject);
        fileStream.on("finish", resolve);
    });

    console.log('Downloaded book');

    const zip = fs.createReadStream(filePath).pipe(unzipper.Parse({forceStream: true}));
    for await (const entry of zip) {
        const fileName = entry.path;
        if (fileName.endsWith(ext)) {
            entry.pipe(fs.createWriteStream(`files/${fileUUID}.${ext}`));
        } else {
            entry.autodrain();
        }
    }

    await ctx.reply('Вот ваша книга! ✨');
    await ctx.replyWithDocument(new InputFile(`files/${fileUUID}.${ext}`, `${book.title}.${ext}`));
}

bot.callbackQuery("back", async (ctx) => {
    const {books} = ctx.session;
    await showBookList(ctx, books, --ctx.session.page);
    await ctx.answerCallbackQuery();
});

bot.callbackQuery("forward", async (ctx) => {
    const {books} = ctx.session;
    await showBookList(ctx, books, ++ctx.session.page);
    await ctx.answerCallbackQuery();
});

bot.on("callback_query:data", async (ctx) => {
    const [callbackType, id] = ctx.callbackQuery.data.split('_');

    switch (callbackType) {
        case 'book':
            const {books} = ctx.session;
            await suggestBookDownload(ctx, books[id])
            break;
        case 'download':
            const {book} = ctx.session;
            await downloadBook(ctx, book, id)
            break;
        default:
            console.log("Unknown button event with payload", ctx.callbackQuery.data);
            break;
    }

    await ctx.answerCallbackQuery();
});

bot.command("start", async (ctx) => {
    ctx.reply("Welcome! Up and running.")
});

bot.command("book", async (ctx) => {
    await ctx.conversation.enter("searchBook");
});

bot.catch(async (err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    console.error("Error:", e);
    await ctx.reply('При поиске произошла ошибка.');
});

await bot.api.setMyCommands([
    { command: "book", description: "Скачать книгу" },
]);

tr.setTorAddress('127.0.0.1', '9050');
const agent = new SocksProxyAgent('socks5h://127.0.0.1:9050');
const flibustaApi = new FlibustaAPI.default(URL, {
    httpAgent: agent,
});

bot.start()
console.log('Bot is launched')

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
