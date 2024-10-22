const TelegramBot = require('node-telegram-bot-api');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
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
  } else if (text.startsWith('/audio')) {
    const url = text.split(' ')[1];
    if (ytdl.validateURL(url)) {
      const format = text.split(' ')[2] || 'mp3';  // Default to mp3 if no format provided
      bot.sendMessage(chatId, `Downloading audio in ${format} format, please wait...`);
      const audioStream = ytdl(url, { filter: 'audioonly' });
      const fileName = `./${ytdl.getURLVideoID(url)}.${format}`;

      ffmpeg(audioStream)
        .audioBitrate(128)
        .save(fileName)
        .on('progress', (progress) => {
          bot.sendMessage(chatId, `Progress: ${progress.percent.toFixed(2)}%`);
        })
        .on('end', () => {
          bot.sendMessage(chatId, 'Audio download complete. Uploading...');
          bot.sendDocument(chatId, fileName)
            .then(() => fs.unlinkSync(fileName))
            .catch(err => {
              console.error(err);
              bot.sendMessage(chatId, 'Failed to upload the audio. Please try again.');
            });
        });
    } else {
      bot.sendMessage(chatId, 'Invalid YouTube URL. Please try again.');
    }
  } else {
    bot.sendMessage(chatId, 'Use /download <YouTube URL> to get video or /audio <YouTube URL> <format> for audio.');
  }
});
