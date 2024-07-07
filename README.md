# tgbot
### A simple telegram bot for downloading books from Flibusta.
Uses an [unofficial Flibusta API](https://github.com/ynhhoJ/flibusta-api/tree/master).

## Getting started
To set up this Telegram bot, you need two things:
1. Tor connection from Tor Bundle
2. Your Telegram bot key in the process.env file

### Setting up Tor connection
Download [Tor Expert Bundle](https://www.torproject.org/download/tor/) and set it up. There's an [article](https://community.torproject.org/relay/setup/bridge/windows/) that explains how to do it.

### Adding your Telegram bot key
Create a process.env file in the root folder and add a key named BOT_TOKEN with your bot key.

## TO-DO
1. Add English translation
2. Add book description when selecting
3. Remove Tor dependency (hard to set up in Russia without VPN, maybe using VPN without Tor is better)
