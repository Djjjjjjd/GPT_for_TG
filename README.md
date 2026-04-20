# Telegram GPT Assistant Bot

Production-ready Telegram bot on Node.js. It receives Telegram messages through a webhook, sends user text to the OpenAI API with a fixed system prompt, keeps short in-memory dialog history per `chat_id`, and returns the assistant answer back to Telegram.

## Project Structure

```text
.
├── .env.example
├── .gitignore
├── ecosystem.config.cjs
├── package.json
├── prompts
│   └── system.md
├── README.md
└── src
    ├── bot.js
    ├── config.js
    ├── openai.js
    ├── server.js
    └── sessionStore.js
```

## Requirements

- Ubuntu VPS
- Node.js 20+
- Nginx
- Domain name pointed to the VPS
- HTTPS certificate
- Telegram bot token from BotFather
- OpenAI API key

Telegram webhooks require a public HTTPS URL. An IP address with plain HTTP is not enough for production webhooks.

## Environment Variables

Copy the example file:

```bash
cp .env.example .env
nano .env
```

Fill in:

```env
PORT=3000
TELEGRAM_BOT_TOKEN=123456789:your_telegram_bot_token
TELEGRAM_WEBHOOK_SECRET=your_random_secret_token
OPENAI_API_KEY=sk-your_openai_api_key
OPENAI_MODEL=gpt-5.4
BASE_URL=https://bot.example.com
SYSTEM_PROMPT_FILE=prompts/system.md
SYSTEM_PROMPT=
HISTORY_LIMIT=20
```

Generate a webhook secret:

```bash
openssl rand -hex 32
```

The easiest way to edit bot behavior is `prompts/system.md`. After changing the prompt, restart PM2. If `SYSTEM_PROMPT_FILE` is empty, the bot uses `SYSTEM_PROMPT` from `.env`.

## Install Dependencies

```bash
npm install
```

## Local Run

For local development:

```bash
npm run dev
```

For a normal start:

```bash
npm start
```

Local webhook testing requires a public HTTPS URL, for example through a tunnel. For production, use a real domain, Nginx, and HTTPS.

## Ubuntu VPS Setup

Update packages:

```bash
sudo apt update && sudo apt upgrade -y
```

Install Node.js 20:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

Install Git, Nginx, and Certbot:

```bash
sudo apt install -y git nginx certbot python3-certbot-nginx
```

Clone your project:

```bash
git clone https://github.com/your-user/telegram-gpt-assistant-bot.git
cd telegram-gpt-assistant-bot
```

Install dependencies:

```bash
npm install
```

Create `.env`:

```bash
cp .env.example .env
nano .env
```

## Domain Setup

1. Open your domain DNS panel.
2. Create an `A` record.
3. Point `bot.example.com` or your root domain to the VPS public IPv4 address.
4. Wait for DNS propagation.
5. Check it:

```bash
dig bot.example.com
```

`BASE_URL` in `.env` must match the HTTPS domain:

```env
BASE_URL=https://bot.example.com
```

## PM2 Setup

Install PM2 globally:

```bash
sudo npm install -g pm2
```

Start the bot:

```bash
pm2 start ecosystem.config.cjs
```

Save PM2 process list:

```bash
pm2 save
```

Enable PM2 startup after reboot:

```bash
pm2 startup systemd
```

PM2 will print a command with `sudo env PATH=...`. Copy and run that printed command.

Useful PM2 commands:

```bash
pm2 status
pm2 logs telegram-gpt-assistant-bot
pm2 restart telegram-gpt-assistant-bot
pm2 stop telegram-gpt-assistant-bot
pm2 delete telegram-gpt-assistant-bot
```

## Nginx Reverse Proxy

Create config:

```bash
sudo nano /etc/nginx/sites-available/telegram-gpt-assistant-bot
```

Example config:

```nginx
server {
    listen 80;
    server_name bot.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable config:

```bash
sudo ln -s /etc/nginx/sites-available/telegram-gpt-assistant-bot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Enable HTTPS With Certbot

Run:

```bash
sudo certbot --nginx -d bot.example.com
```

Follow the prompts and choose redirect HTTP to HTTPS if Certbot asks.

Check auto-renewal:

```bash
sudo certbot renew --dry-run
```

## Telegram Webhook

Set webhook:

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -d "url=https://bot.example.com/telegram/webhook" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>" \
  -d "drop_pending_updates=true" \
  -d 'allowed_updates=["message"]'
```

Check webhook info:

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo"
```

Delete webhook if needed:

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/deleteWebhook"
```

## Healthcheck

Open in browser:

```text
https://bot.example.com/health
```

Or use curl:

```bash
curl https://bot.example.com/health
```

Expected response:

```json
{
  "status": "ok",
  "sessions": 0
}
```

## Restart Bot

After changing `.env`, `prompts/system.md`, or code:

```bash
pm2 restart telegram-gpt-assistant-bot
```

## Update Code With Git Pull

```bash
cd telegram-gpt-assistant-bot
git pull
npm install
pm2 restart telegram-gpt-assistant-bot
```

## Notes

- Dialog history is stored in memory and is lost after restart.
- The bot keeps the last 20 messages per chat by default.
- For a bigger production system, replace `src/sessionStore.js` with Redis or a database.
- Non-text messages receive a polite fallback response.
- `/reset` clears the current chat history.
