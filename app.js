(function () {
    "use strict";
    const rss = require("stabl-rss-to-json");
    const firebase = require("firebase");
    const _ = require("underscore");

    if (process.argv.length !== 5) {
        console.log("usage: node app.js <auth path> <db address> <itunes url>");
        process.exit(1);
    }

    firebase.initializeApp({
        serviceAccount: process.argv[2],
        databaseURL: process.argv[3]
    });

    function normalize(item) {
        item.pubDate = Date.parse(item.pubDate);
        return item;
    }

    function fetch(id) {
        return new Promise(function (resolve, reject) {
            rss.feedUrlFromItunesCollectionId(id)
                .then(rss.parseFeedUrl)
                .then(feed => {
                    var item = _.first(feed);
                    firebase.database().ref('items').push(normalize(item))
                    .then(val => {
                        resolve(val);
                    }).catch(reason => {
                        reject(reason);
                    });
                }).catch(err => {
                    reject(err);
                });
        });
    }

    fetch(process.argv[4])
        .then(val => {
            console.log("Added: " + val.key);
            process.exit(0);
        })
        .catch(msg => {
            console.log(msg);
            process.exit(1);
        });
})();