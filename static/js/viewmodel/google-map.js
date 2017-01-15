var postbox = new ko.subscribable();

function googleMapViewModel() {
    var self = this;
    self.myMap = ko.observable({
        city: ko.observable(),
        infowindowContent: {
            placeicon: ko.observable(''),
            placename: ko.observable(''),
            placeaddress: ko.observable(''),
            placeurl: ko.observable('#'),
            placephone: ko.observable(''),
            placerating: ko.observable(''),
            placewebsite: ko.observable(''),
            placeprice: ko.observable(''),
            placehours: ko.observable('')
        },
        nearbySearch: {
            type: ko.observable('point_of_interest'),
            update: ko.observable(false),
            results: ko.observableArray()
        },
        geocode: ko.observable(),
        isready: ko.observable(false),
        iserror: ko.observable(false)
    });

    self.myMap().city.subscribe(function(newValue) {
        postbox.notifySubscribers(newValue, "city");
    });

    self.myMap().geocode.subscribe(function(newValue) {
        postbox.notifySubscribers(newValue, "geocode");
    });

    self.myMap().isready.subscribe(function(newValue) {
        postbox.notifySubscribers(newValue, "ready");
    });

    self.ready = ko.computed(function() {
        return this.isready();
    }, self.myMap());

    self.myMap().iserror.subscribe(function(newValue) {
        postbox.notifySubscribers(newValue, "error");
    });
}


var mapObj;
var reload;
ko.bindingHandlers.googleMap = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        // This will be called when the binding is first applied to an element
        // Set up any initial state, event handlers, etc. here

        // Initial Google Map

        // http://jsfiddle.net/schmidlop/5eTRV/10/
        mapObj = ko.utils.unwrapObservable(valueAccessor());

        var mapOptions = {
            center: {lat: 37.1, lng: -95.7},    // US
            zoom: 5,
            mapTypeControl: false,
            // panControl: false,
            // zoomControl: false,
            streetViewControl: false
        };

        mapObj.map = new google.maps.Map(element, mapOptions);

        var card = document.getElementById('pac-card');
        var input = document.getElementById('pac-input');

        // https://developers.google.com/maps/documentation/javascript/controls#ControlPositioning
        mapObj.map.controls[google.maps.ControlPosition.TOP_CENTER].push(card);

        mapObj.autocomplete = new google.maps.places.Autocomplete(input);

        // Limit autocomplete type to address only
        mapObj.autocomplete.setTypes(['geocode']);

        // Infomation window
        mapObj.infowindow = new google.maps.InfoWindow();
        var infowindowContent = document.getElementById('infowindow-content');
        mapObj.infowindow.setContent(infowindowContent);
        mapObj.marker = new google.maps.Marker({
            map: mapObj.map,
            anchorPoint: new google.maps.Point(0, -29)
        });

        mapObj.autocomplete.addListener('place_changed', onPlaceChanged);


        // Place searches
        mapObj.places = new google.maps.places.PlacesService(mapObj.map);
        mapObj.markers = [];
        //var mapObj = ko.utils.unwrapObservable(valueAccessor());
        //mapObj.map = map;


        // Try HTML5 geolocation.
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                var pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                mapObj.map.panTo(pos);
                mapObj.map.setZoom(17);

                mapObj.marker.setPosition(pos);
                mapObj.marker.setVisible(true);

                // Reverse Geocoding
                var geocoder = new google.maps.Geocoder();
                geocoder.geocode({'location': pos}, function(results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        if (results[0]) {
                            document.getElementById('pac-input').value = results[0].formatted_address;
                            mapObj.marker.placeResult = results[0];
                            // google.maps.event.addListener(mapObj.marker, 'click', showInfoWindow);
                            mapObj.city(getCity(results[0]));
                            mapObj.geocode( results[0].geometry.location.lat() + ',' + results[0].geometry.location.lng() );
                            mapObj.isready(true);
                        }
                    } else {
                        document.getElementById('pac-input').value = pos.lat + ", " + pos.lng;
                    }
                });

                // Now search in idle listener
                // searchPlaces();
                reload = true;

            }, function() {
                console.log("Failed to get geolocation");
            });
        }


        mapObj.map.addListener('idle', function() {
            if (reload || ( mapObj && mapObj.marker && mapObj.marker.placeResult && mapObj.nearbySearch.update()) )
                searchPlaces();
            reload = false;
        });

    }
};

/* Autocomplete callback */
function onPlaceChanged() {

    mapObj.infowindow.close();
    mapObj.marker.setVisible(false);

    mapObj.iserror(false);
    // Using autocomplete
    var place = mapObj.autocomplete.getPlace();

    if (!place.geometry) {
        // User entered the name of a Place that was not suggested and
        // pressed the Enter key, or the Place Details request failed.
        document.getElementById('pac-input').value = '';
        document.getElementById('pac-input').placeholder = 'Enter a location';
        mapObj.iserror(true);
        return;
    }


    // 1: World, 5: Landmass/continent, 10: City, 15: Streets, 20: Buildings
    // mapObj.map.setCenter(place.geometry.location);

    mapObj.marker.placeResult = place;

    mapObj.marker.setPosition(place.geometry.location);
    mapObj.marker.setVisible(true);
    // google.maps.event.addListener(mapObj.marker, 'click', showInfoWindow);


    mapObj.map.panTo(place.geometry.location);
    mapObj.map.setZoom(17);

    // Now search in the idle listener
    // searchPlaces();
    reload = true;

    mapObj.city(getCity(place));
    mapObj.geocode( place.geometry.location.lat() + ',' + place.geometry.location.lng() );
    mapObj.isready(true);
}


function searchPlaces() {
    var search = {
        bounds: mapObj.map.getBounds(),
        type: mapObj.nearbySearch.type()
    };

    mapObj.places.nearbySearch(search, nearbySearchCallback);
}

var MARKER_PATH = 'https://developers.google.com/maps/documentation/javascript/images/marker_green';
var hostnameRegexp = new RegExp('^https?://.+?/');

function nearbySearchCallback(results, status) {
    clearResults();
    clearMarkers();

    if (status === google.maps.places.PlacesServiceStatus.OK) {
        // Create a marker for each hotel found, and
        // assign a letter of the alphabetic to each marker icon.

        // TODO: set limits
        for (var i = 0; i < results.length && i < 10; i++) {
            var markerLetter = String.fromCharCode('A'.charCodeAt(0) + (i % 26));
            var markerIcon = MARKER_PATH + markerLetter + '.png';
            // Use marker animation to drop the icons incrementally on the map.
            mapObj.markers[i] = new google.maps.Marker({
                position: results[i].geometry.location,
                animation: google.maps.Animation.DROP,
                icon: markerIcon
            });
            // If the user clicks a hotel marker, show the details of that hotel
            // in an info window.
            mapObj.markers[i].placeResult = results[i];
            google.maps.event.addListener(mapObj.markers[i], 'click', showInfoWindow);
            setTimeout(dropMarker(i), i * 100);
            addResult(results[i], i);
        }
    } else {
        var resultRow = {};
        resultRow.icon = '';
        resultRow.name = 'No ' + mapObj.nearbySearch.type().replace("_", " ") + ' found near ' + mapObj.marker.placeResult.formatted_address;
        resultRow.backgroundColor = '#F0F0F0';
        resultRow.onclick = function() {};
        mapObj.nearbySearch.results.push(resultRow);
    }
}


function changeTypeCallback() {
    if (mapObj && mapObj.marker.placeResult) {
        searchPlaces();
    }
    return true;
}

function clearMarkers() {
    for (var i = 0; i < mapObj.markers.length; i++) {
        if (mapObj.markers[i]) {
            mapObj.markers[i].setMap(null);
        }
    }
    mapObj.markers = [];
}


function clearResults() {
    mapObj.nearbySearch.results.removeAll();
}


function addResult(result, i) {
    var markerLetter = String.fromCharCode('A'.charCodeAt(0) + (i % 26));
    var markerIcon = MARKER_PATH + markerLetter + '.png';

    var resultRow = {};
    resultRow.icon = markerIcon;
    resultRow.name = result.name;
    resultRow.backgroundColor = (i % 2 === 0 ? '#F0F0F0' : '#FFFFFF');
    resultRow.onclick = function() {
        google.maps.event.trigger(mapObj.markers[i], 'click');
    };

    mapObj.nearbySearch.results.push(resultRow);
}

function showInfoWindow() {
    var marker = this;
    mapObj.places.getDetails({placeId: marker.placeResult.place_id},
        function(place, status) {
            if (status !== google.maps.places.PlacesServiceStatus.OK) {
                return;
            }
            mapObj.infowindow.open(mapObj.map, marker);
            buildIWContent(place);
        });

    mapObj.nearbySearch.update(false);
}


function buildIWContent(place) {
    mapObj.infowindowContent.placeicon(place.icon);
    mapObj.infowindowContent.placeurl(place.url);
    mapObj.infowindowContent.placename(place.name);
    mapObj.infowindowContent.placeaddress(place.vicinity);

    if (place.formatted_phone_number) {
        mapObj.infowindowContent.placephone(place.formatted_phone_number);
    }

    // Assign a five-star rating to the hotel, using a black star ('&#10029;')
    // to indicate the rating the hotel has earned, and a white star ('&#10025;')
    // for the rating points not achieved.
    if (place.rating) {
        var ratingHtml = '';
        for (var j = 0; j < 5; j++) {
            if (place.rating < (j + 0.5)) {
                ratingHtml += '&#10025;';
            } else {
                ratingHtml += '&#10029;';
            }
            mapObj.infowindowContent.placerating(ratingHtml);
            // document.getElementById('iw-rating').innerHTML = ratingHtml;
        }
    }

    // The regexp isolates the first part of the URL (domain plus subdomain)
    // to give a short URL for displaying in the info window.
    if (place.website) {
        var fullUrl = place.website;
        var website = hostnameRegexp.exec(place.website);
        if (website === null) {
            website = 'http://' + place.website + '/';
            fullUrl = website;
        }
        mapObj.infowindowContent.placewebsite(website);
    }

    // Assign a five-dollar rating to the place,
    if (place.price_level) {
        var priceHtml = '';
        for (var j = 0; j < place.price_level; j++) {
            priceHtml += '&#36;';
        }
        mapObj.infowindowContent.placeprice(priceHtml);
    }

    if (place.opening_hours && place.opening_hours.weekday_text) {
        var nDay = new Date().getDay();
        nDay = (nDay - 1);

        var weekday_text;
        if (nDay < 0) {
            weekday_text = place.opening_hours.weekday_text[6];
        } else {
            weekday_text = place.opening_hours.weekday_text[nDay];
        }

        var idx = weekday_text.indexOf(":");
        weekday_text = weekday_text.substring(idx+1).trim();

        mapObj.infowindowContent.placehours(weekday_text);
    }
}

function getCity(place) {
    var queryTerm = '';
    if (place.address_components) {
        for (var i = 0; i < place.address_components.length; i++) {
            // City
            if (place.address_components[i].types[0] == "locality") {
                queryTerm = place.address_components[i].long_name || '';
                break;
            }
            // State
            if (place.address_components[i].types[0] == "administrative_area_level_1") {
                queryTerm = place.address_components[i].long_name || '';
                break;
            }
            // Country
            if (place.address_components[i].types[0] == "country") {
                queryTerm = place.address_components[i].long_name || '';
                break;
            }
            // Postal code
            if (place.address_components[i].types[0] == "postal_code") {
                queryTerm = place.address_components[i].long_name || '';
                break;
            }

        }
        return queryTerm;
    }
}

function dropMarker(i) {
    return function() {
        mapObj.markers[i].setMap(mapObj.map);
    };
}

var gMapVM = new googleMapViewModel();