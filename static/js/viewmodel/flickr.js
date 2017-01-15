function flickrViewModel() {
    var self = this;
    self.myFlickr = ko.observable({
        city: ko.observable(''),
        title: ko.observable('Flickr'),
        geocode: ko.observable(''),
        photos: ko.observableArray([
            {
                title: "Place holder",
                owner: "Admin",
                src: $('header').css('background-image').replace(/^url|[\(\)]/g, ''),
                url: "#"
            }
        ])
    });

    self.ready = ko.observable(false);
    postbox.subscribe(function(newValue) {
        self.ready(newValue);
    }, this, "ready");
}


ko.bindingHandlers.flickr = {
    init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        // This will be called when the binding is first applied to an element
        // Set up any initial state, event handlers, etc. here

        flickrObj = ko.utils.unwrapObservable(valueAccessor());

        postbox.subscribe(function(newValue) {
            flickrObj.city(newValue);
        }, this, "city");

        postbox.subscribe(function(newValue) {
            flickrObj.geocode(newValue);
        }, this, "geocode");

    },
    update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        // This will be called once when the binding is first applied to an element,
        // and again whenever any observables/computeds that are accessed change
        // Update the DOM element based on the supplied values here.


        if (flickrObj.city().length > 0 && flickrObj.geocode().length > 0) {

            var geocode = flickrObj.geocode().split(',');
            var flickrUrl = "https://api.flickr.com/services/rest/";
            flickrUrl += '?' + $.param({
                    'method': "flickr.photos.search",
                    'api_key': "095fe2bd7dd58482409412e0edf4ecae",
                    'text': flickrObj.city(),
                    'lat': geocode[0].toString(),
                    'lon': geocode[1].toString(),
                    'radius': "20",
                    'radius_units': 'mi',
                    'sort': "interestingness-desc",
                    'privacy_filter': '1',
                    'format': 'json',
                    'nojsoncallback': '1',
                    'per_page': "50"
                });

            $.getJSON(flickrUrl, function () {
                console.log("Flickr API Called");
            })
                .done(function (data) {
                    flickrObj.photos.removeAll();
                    if (data.stat == "ok") {
                        var photos = data.photos.photo;

                        for (var i = 0; i < photos.length; i++) {
                            var photo = photos[i];
                            var p = {};

                            // https://www.flickr.com/services/api/misc.urls.html
                            var mstzb = "b";

                            p.title = photo.title;
                            p.owner = photo.owner;
                            p.src = "https://farm" + photo.farm + ".staticflickr.com/"
                                + photo.server + "/" + photo.id + "_" + photo.secret + "_" + mstzb + ".jpg";
                            p.url = "https://www.flickr.com/photos/" + photo.owner + "/" + photo.id;

                            flickrObj.photos.push(p);
                        }
                    } else {
                        console.log("Fail");
                    }
                })
                .fail(function () {
                    flickrObj.photos.removeAll();
                    console.log("Fail");
                })
                .always(function () {
                    flickrObj.title('The beauty of ' + flickrObj.city() + ' on Flickr');
                });
        }
    }
};


var flickrVM = new flickrViewModel();