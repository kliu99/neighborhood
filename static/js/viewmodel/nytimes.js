function nytimesViewModel() {
    var self = this;
    self.myNews = ko.observable({
        city: ko.observable(''),
        title: ko.observable('New York Times Articles'),
        articles: ko.observableArray(),
        articlesR: ko.observableArray()
    });

    self.ready = ko.observable(false);
    postbox.subscribe(function(newValue) {
        self.ready(newValue);
    }, this, "ready");
}


ko.bindingHandlers.nytimes = {
    init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        // This will be called when the binding is first applied to an element
        // Set up any initial state, event handlers, etc. here

        nytimesObj = ko.utils.unwrapObservable(valueAccessor());

        postbox.subscribe(function(newValue) {
            nytimesObj.city(newValue);
        }, this, "city");
    },
    update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        // This will be called once when the binding is first applied to an element,
        // and again whenever any observables/computeds that are accessed change
        // Update the DOM element based on the supplied values here.
        // NYT api

        // 7d29510ec7454629b50f59d56dc1a66b

        if (nytimesObj.city().length > 0) {
            var NYTurl = "https://api.nytimes.com/svc/search/v2/articlesearch.json";
            NYTurl += '?' + $.param({
                    'api-key': "8ae7b2d4797a4608b87a35efc0dd0570",
                    'q': nytimesObj.city(),
                    'sort': "newest",
                    'fl': "web_url,headline,snippet"
                    // 'page': 0
                });

            $.getJSON(NYTurl, function () {
                console.log("NYT API Called");
            })
                .done(function (data) {
                    nytimesObj.articles.removeAll();
                    nytimesObj.articlesR.removeAll();

                    for (var i = 0; i < data.response.docs.length; i++) {
                        var val = data.response.docs[i];
                        var doc_url = val['web_url'];
                        var doc_headline = val['headline']['main'];
                        var doc_snippet = val['snippet'];

                        var doc = {};
                        doc.url = doc_url;
                        doc.headline = doc_headline;
                        doc.snippet = doc_snippet;
                        if (i % 2 == 0) {
                            nytimesObj.articles.push(doc);
                        } else {
                            nytimesObj.articlesR.push(doc);
                        }
                    }


                    // $.each(data['response']["docs"], function (key, val) {
                    //
                    //
                    //
                    //
                    //     // $nytElem.append(
                    //     //     '<li class="article">' +
                    //     //     '<a href="' + doc_url + '"  target="_blank">' + doc_headline + '</a>' +
                    //     //     '<p>' + doc_snippet + '</p>' +
                    //     //     '</li>'
                    //     // );
                    // });
                })
                .fail(function () {
                    nytimesObj.articles.removeAll();
                    nytimesObj.articlesR.removeAll();

                    var doc = {};
                    doc.url = '';
                    doc.headline = 'New York Times articles could not be loaded';
                    doc.snippet = '';
                    nytimesObj.articles.push(doc);
                })
                .always(function () {
                    nytimesObj.title('New York Times Articles about ' + nytimesObj.city());
                    // $nytHeaderElem.text('New York Times Articles About ' + city);
                });
        }
    }
};


var nytVM = new nytimesViewModel();