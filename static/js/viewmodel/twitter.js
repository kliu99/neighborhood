function twitterViewModel() {
    var self = this;
    self.myTweets = ko.observable({
        city: ko.observable(''),
        geocode: ko.observable(''),
        title: ko.observable('Tweets'),
        tweets: ko.observableArray(),
        tweetsR: ko.observableArray()
    });

    self.ready = ko.observable(false);
    postbox.subscribe(function(newValue) {
        self.ready(newValue);
    }, this, "ready");
}


ko.bindingHandlers.twitter = {
    init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        // This will be called when the binding is first applied to an element
        // Set up any initial state, event handlers, etc. here

        tweetObj = ko.utils.unwrapObservable(valueAccessor());

        postbox.subscribe(function(newValue) {
            tweetObj.city(newValue);
        }, this, "city");

        postbox.subscribe(function(newValue) {
            tweetObj.geocode(newValue);
        }, this, "geocode");
    },
    update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        // This will be called once when the binding is first applied to an element,
        // and again whenever any observables/computeds that are accessed change
        // Update the DOM element based on the supplied values here.


        if (tweetObj.city() && tweetObj.geocode()) {
            var twitterUrl = "tweets";
            twitterUrl += '?' + $.param({
                    'location': tweetObj.city(),
                    'geocode': tweetObj.geocode(),
                    'count': 20
                });


            $.getJSON(twitterUrl, function () {
                console.log("Tweets Called");
            })
                .done(function (data) {
                    var tweets = data.tweet;

                    // console.log(tweets);
                    // console.log(tweets.length);

                    tweetObj.tweets.removeAll();
                    tweetObj.tweetsR.removeAll();

                    for (var i = 0; i < tweets.length; i++) {
                        var tweet = tweets[i];

                        var t = {};
                        t.tweet_text = tweet.tweet_text[0];
                        t.status_id = tweet.status_id[0];

                        var tweet_time = tweet.tweet_created.split(" ");
                        t.tweet_created = tweet_time[1] + " " + tweet_time[2];

                        var user = tweet.user;
                        t.user_name = user.name;
                        t.screen_name = user.screen_name;
                        t.profile_img = user.profile_image_url;

                        if (i % 2 == 0) {
                            tweetObj.tweets.push(t);
                        } else {
                            tweetObj.tweetsR.push(t);
                        }
                    }
                })
                .fail(function () {
                    tweetObj.tweets.removeAll();
                    tweetObj.tweetsR.removeAll();

                    var t = {};
                    t.tweet_text = "Tweets could not be loaded";
                    t.status_id = '';

                    var tweet_time = new Date().toString().split(" ");
                    t.tweet_created = tweet_time[1] + " " + tweet_time[2];

                    t.user_name = 'Admin';
                    t.screen_name = 'admin';
                    t.profile_img = '';

                    tweetObj.tweets.push(t);
                    // nytimesObj.articles.removeAll();
                    // var doc = {};
                    // doc.url = '';
                    // doc.headline = 'New York Times articles could not be loaded';
                    // doc.snippet = '';
                    // nytimesObj.articles.push(doc);

                    console.log("Fail");
                })
                .always(function () {
                    tweetObj.title('#' + tweetObj.city());
                });
        }
    }
};


var twitterVM = new twitterViewModel();