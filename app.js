(function () {
    "use strict";
    const parser = require("parse-rss");
    const firebase = require("firebase");
    const request = require('request-promise');

    if (process.argv.length !== 5) {
        console.log("usage: node app.js <auth path> <db address> <itunes url>");
        process.exit(1);
    }

    firebase.initializeApp({
        serviceAccount: process.argv[2],
        databaseURL: process.argv[3]
    });

    function parseFeed(rss) {
        const first = rss[0];
        var meta = first.meta;
        var parsed = {};
        parsed.feedUrl = meta.xmlUrl;
        parsed.collectionName = meta.title;
        parsed.title = first.title;
        parsed.link = first.link;
        parsed.guid = first.guid;
        parsed.pubDate = Date.parse(first.pubDate);
        parsed.categories = meta.categories;
        parsed.author = first.author;
        parsed.thumbnail = first.image.url || meta.image.url || '';
        parsed.description = first.description;
        parsed.enclosure = first["media:content"]['@'];

        return parsed;
    }

    function parseFeedUrl(url) {
        return new Promise(function (resolve, reject) {
            parser(url, function (err, rss) {
                if (err) {
                    reject(err);
                }
                firebase.database().ref('items').push(parseFeed(rss))
                    .then(function (val) {
                        resolve(val);
                    }).catch(function (reason) {
                        reject(reason);
                    });
            });
        });
    }

    function fetch(url) {
        return new Promise(function (resolve, reject) {
            request({method: 'GET', uri: url})
                .then(function (response) {
                    var parsed = JSON.parse(response);
                    if (parsed.resultCount !== 1) {
                        reject(new Error('Expected 1 result, found ' + parsed.resultCount));
                    }
                    var feedUrl = parsed.results[0].feedUrl;
                    resolve(feedUrl);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    }

    fetch(process.argv[4])
        .then(parseFeedUrl)
        .then(function (val) {
            console.log("Added: " + val.key);
            process.exit(0);
        })
        .catch(function (msg) {
            console.log(msg);
            process.exit(1);
        });
})();