(function () {
    "use strict";
    const rss = require("stabl-rss-to-json");
    const Parse = require("parse/node");
    const _ = require("underscore");

    if (process.argv.length !== 7) {
        console.log("usage: node app.js <user> <pass> <app id> <server url> <itunes collection id>");
        process.exit(1);
    }

    Parse.initialize(process.argv[4]);
    Parse.serverURL = process.argv[5]

    function save(item) {
        return Parse.User.logIn(process.argv[2], process.argv[3]).then(user => {
            var PodcastItem = Parse.Object.extend("PodcastItem");
            var podcastItem = new PodcastItem();
            return podcastItem.save(item, {sessionToken : user.getSessionToken()});
        })
    }

    function fetch(id) {
        return new Promise((resolve, reject) => {
            rss.feedUrlFromItunesCollectionId(id)
                .then(rss.parseFeedUrl)
                .then(feed => {
                    var item = _.first(feed);
                    resolve(save(item));
                })
                .catch(reject);
        });
    }

    fetch(process.argv[6])
        .then(val => {
            console.log(val);
            process.exit(0);
        })
        .catch(msg => {
            console.log(msg);
            process.exit(1);
        });
})();