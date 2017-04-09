/*!
* CongressBot : A Twitter bot that tweets new congressional bills.
* Version 1.0.0
* Created by Dominic Magnifico (http://dommagnifi.co)
*/

require('dotenv').config();


var firebase = require("firebase");

var config = {
  apiKey: process.env.FIREBASE_APIKEY,
  authDomain: process.env.FIREBASE_AUTHDOMAIN,
  databaseURL: process.env.FIREBASE_DATABASEURL,
  projectId: process.env.FIREBASE_PROJECTID,
  storageBucket: process.env.FIREBASE_STORAGEBUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGINGSENDERID
};
firebase.initializeApp(config);

const db = firebase.database();
const ref = db.ref('/');

var Twit = require('twit');
var length = 78;
var tweeted = [];
var runCount = 0;

var Bot = new Twit({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

console.log('The bot is running...');

/* BotInit() : To initiate the bot */
function BotInit() {
  BotTweet();
}

function BotTweet() {
  var request = require('request');
  var url = "https://www.govtrack.us/api/v2/bill?congress=115&order_by=-introduced_date";

  request({
    url: url,
    json: true
  }, function (error, response, body) {

    // If there are no erros with the request, and the file exists, proceed.
    if (!error && response.statusCode === 200) {
      // Add all the bills to an object.
      let bills = body.objects;
      let pos = 0;
      let idsToTweet = {};
      let builtTweets = [];

      // Push each bill ID to an array
      bills.forEach( function(i){
        const id = i.id;
        idsToTweet[pos] = id;
        pos++;
      } );

      ref.child('tweeted').once('value', (snap) => {
        // For each of the ids in idsToTweet, check to see if the ID has already been tweeted.
        for( let id in idsToTweet ) {
          if( snap.val().includes(idsToTweet[id]) ){
            console.log(idsToTweet[id] + ' has already been tweeted');
          } else {
            // Set some variables for the current bill.
            const bill = bills[id];
            const link = bill.link;
            const title = bill.title;
            const billId = bill.id;
            const truncTitle = title.substring(0, length) + "...";
            const tweet = "Congress just introduced '" + truncTitle + "' " + link;
          
            console.log('Bill ID: ' + billId + ' added to the builtTweets array.');
            console.log('**********************');
            builtTweets.push(tweet);
            console.log('Bill ID: ' + billId + ' added to the tweeted array.');
            console.log('**********************');

            const snapVal = snap.val()
            snapVal.push(billId);
            console.log(snapVal);

            ref.set({
              tweeted: snapVal
            });
          }
        }
      });

      // Delayed foreach function to not innundate twitter with tweets. No more 100 tweet dumps.
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
        // Tweet each tweet, waiting 15 minutes between each.
        builtTweets.delayedForEach(function(tweet, index, array){
          //Report number of tweets in the pipeline.
          console.log( 'There are ' + builtTweets.length + ' tweets queued.' );
          console.log('**********************');
          const toTweet = array[0];

          // If there's something to tweet.
          if ( toTweet !== undefined ) {
            Bot.post('statuses/update', { status: toTweet }, function(err, data, response) {
              if( toTweet ) {
                console.log('Tweeted: ' + toTweet);
                console.log('**********************');
              }
              if( err ) {
                console.log(err);
              }
            });
          }
          builtTweets.splice( 0,1 );
        }, 15*60*1000); //15 minutes
      }

      staggerTweet();

    } else {
      console.log('error');
    }
  });

  console.log('Request sent. Iteration: ' + runCount);
  console.log('**********************');
  runCount++;

  //Check the JSON file ever 6 hours.
  setInterval(BotTweet, 6*60*60*1000);

}

/* Initiate the Bot */
BotInit();