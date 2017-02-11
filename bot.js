/*!
* CongressBot : A Twitter bot that tweets new congressional bills.
* Version 1.0.0
* Created by Dominic Magnifico (http://dommagnifi.co)
*/

var keys = require('./config');

var Twit = require('twit');
var length = 78;
var tweeted =  [348982,348992,348977,348976,348975,348969,348971,348980,348985,348986,348981,348973,348972,348978,348988,348991,348987,348979,348984,348970,348968,348989,348983,348990,348974,348965,348966,348963,348964,348962,348967,348899,348869,348860,348833,348864,348841,348917,348901,348843,348928,348912,348855,348908,348957,348834,348829,348903,348947,348878,348904,348830,348880,348858,348914,348936,348863,348955,348886,348900,348902,348944,348854,348959,348938,348882,348951,348856,348890,348952,348835,348960,348949,348881,348839,348935,348950,348884,348916,348897,348896,348927,348845,348877,348937,348907,348954,348892,348925,348923,348932,348883,348838,348911,348893,348872,348946,348889,348836,348870];

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

function BotTweet() {
  var request = require("request");

  var url = "https://www.govtrack.us/api/v2/bill?congress=115&order_by=-introduced_date";

  request({
    url: url,
    json: true
  }, function (error, response, body) {

    if (!error && response.statusCode === 200) {
      let bills = body.objects;
      let pos = 0;
      let idsToTweet = {};
      let builtTweets = [];

      bills.forEach( function(i){
        const id = i.id;
        idsToTweet[pos] = id;
        pos++;
      } );

      for( let id in idsToTweet ) {
        if( !tweeted.includes(idsToTweet[id]) ) {
          const bill = bills[id];
          const link = bill.link;
          const title = bill.title;
          const truncTitle = title.substring(0, length) + "...";
          const tweet = "Congress just introduced '" + truncTitle + "' " + link;

          builtTweets.push(tweet);
        }
      }

      Array.prototype.delayedForEach = function(callback, timeout, thisArg){
        var i = 0,
            l = this.length,
            self = this,

        caller = function(){
          callback.call(thisArg || self, self[i], i, self);
          (++i < l) && setTimeout(caller, timeout);
        };

        caller();
      };

      function staggerTweet() {
        builtTweets.delayedForEach(function(tweet){
          Bot.post('statuses/update', { status: tweet }, function(err, data, response) {
            console.log(tweet)
          });
        }, 15*60*1000); //15 minutes
      }

      staggerTweet();

    } else {
      console.log('error');
    }
  });

  //Check the JSON file ever 30 minutes.
  setInterval(BotTweet, 30*60*1000);
}

/* Initiate the Bot */
BotInit();