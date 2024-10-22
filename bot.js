const TelegramBot = require('node-telegram-bot-api');
const ytdl = require('ytdl-core');
const fs = require('fs');

// Replace 'YOUR_TELEGRAM_BOT_TOKEN' with your actual bot token
const token = 'YOUR_TELEGRAM_BOT_TOKEN';
const bot = new TelegramBot(token, { polling: true });

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text.startsWith('/download')) {
    const url = text.split(' ')[1];
    if (ytdl.validateURL(url)) {
      bot.sendMessage(chatId, 'Downloading your video, please wait...');
      const info = await ytdl.getInfo(url);
      const format = ytdl.chooseFormat(info.formats, { quality: 'highest' });
      const videoStream = ytdl(url, { format });

      const fileName = `./${info.videoDetails.title}.mp4`;
      videoStream.pipe(fs.createWriteStream(fileName));

      videoStream.on('end', () => {
        bot.sendMessage(chatId, 'Download complete. Uploading the video...');
        bot.sendDocument(chatId, fileName)
          .then(() => fs.unlinkSync(fileName))
          .catch(err => {
            console.error(err);
            bot.sendMessage(chatId, 'Failed to upload the video. Please try again.');
          });
      });
    } else {
      bot.sendMessage(chatId, 'Invalid YouTube URL. Please try again.');
    }
  } else {
    bot.sendMessage(chatId, 'Please use the command /download <YouTube URL>');
  }
});
