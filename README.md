# tgbot
### A simple telegram bot for downloading books from Flibusta.
Uses an [unofficial Flibusta API](https://github.com/ynhhoJ/flibusta-api/tree/master).

## Getting started
To set up this Telegram bot, you need two things:
1. Free access to Flibusta website
2. Your Telegram bot key in the process.env file

### Gaining access to Flibusta
If you live in a country where Flibusta is not blocked - ~~fuck you~~ congratulations! You can skip this step altogether.
If not, then you need to bypass the restrictions. There are 3 ways of doing so:
1. Use any working VPN
2. Use GoodbyeDPI (great for users from Russian Federation)
3. Use Tor Expert Bundle (used in v1.0.0)

### Setting up GoodbyeDPI
[GoodbyeDPI](https://github.com/ValdikSS/GoodbyeDPI) is a Deep Packet Inspection circumvention utility. Follow the instructions and Flibusta should be unblocked.

You need to run GoodbyeDPI while running your Telegram bot in order for it to work.

### Setting up Tor connection
*Works only for v1.0.0*

Download [Tor Expert Bundle](https://www.torproject.org/download/tor/) and set it up. There's an [article](https://community.torproject.org/relay/setup/bridge/windows/) that explains how to do it.

### Adding your Telegram bot key
Create a process.env file in the root folder and add a key named BOT_TOKEN with your bot key.

## To-Do
1. Add English translation
2. ~~Add book description when selecting~~
3. ~~Remove Tor dependency (hard to set up in Russia without VPN, maybe using VPN without Tor is better)~~
