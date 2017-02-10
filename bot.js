/*!
* CongressBot : A Twitter bot that tweets new congressional bills.
* Version 1.0.0
* Created by Dominic Magnifico (http://dommagnifi.co)
*/

var keys = require('./config');

var Twit = require('twit');
var checksum = require('json-checksum');
var curCh = null;

var Bot = new Twit({
  consumer_key: keys.TWITTER_CONSUMER_KEY,
  consumer_secret: keys.TWITTER_CONSUMER_SECRET,
  access_token: keys.TWITTER_ACCESS_TOKEN,
  access_token_secret: keys.TWITTER_ACCESS_TOKEN_SECRET
});

console.log('The bot is running...');

/* BotInit() : To initiate the bot */
function BotInit() {
  BotTweet();
}

/* BotTweet() : To retweet the matching recent tweet */
function BotTweet() {
  
  var request = require("request")
  
  var url = "https://www.govtrack.us/api/v2/bill?congress=115&order_by=-introduced_date"
  
  request({
    url: url,
    json: true
  }, function (error, response, body) {
    
    if (!error && response.statusCode === 200) {
      const length = 78;
      const link = body.objects[0].link;
      const title = body.objects[0].title;
      const truncTitle = title.substring(0, length) + "...";
      const tweet = "Congress just introduced '" + truncTitle + "' " + link;
      var ch = checksum(body);
      
      // Comparing checksums
      if(curCh != ch) {
        curCh = ch;
        Bot.post('statuses/update', { status: tweet }, function(err, data, response) {
          console.log(tweet)
        });
      }
    }
  });
  
  /* Set an interval of 30 minutes (in microsecondes) */
  setInterval(BotTweet, 30*60*1000);
}

/* Initiate the Bot */
BotInit();