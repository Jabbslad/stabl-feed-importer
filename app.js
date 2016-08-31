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
            var PodcastItem = Parse.Object.extend("NewPodcastItem");
            var podcastItem = new PodcastItem();
            return podcastItem.save(item, {sessionToken : user.getSessionToken()});
        })
    }

    function fetch(id) {
        return new Promise((resolve, reject) => {
            rss.feedFromItunesCollectionId(id)
                .then(collection => {
                    resolve(collection);
                })
                .catch(reject);
        });
    }

    function merge(obj1, obj2) {
        for (var attrname in obj2) { 
            obj1[attrname] = obj2[attrname]; 
        }
        return obj1;
    }

    function construct(collection) {
        return new Promise((resolve, reject) => {
            rss.parseFeedUrl(collection.feedUrl)
                .then(feed => {
                    resolve(merge(collection, _.first(feed)));
                })
                .catch(msg => {
                    reject(msg);
                });
        });
    }

    fetch(process.argv[6])
        .then(collection => {
            return construct(collection);
        })
        .then(feed => {
            return save(feed);
        })
        .then(result => {
            console.log(result);
        })
        .catch(msg => {
            console.log(msg);
            process.exit(1);
        });
})();