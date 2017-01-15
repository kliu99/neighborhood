// This example requires the Places library. Include the libraries=places
// parameter when you first load the API. For example:
// <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places">


// Initial ko model when Google Map is loaded
function koInit(){
    ko.applyBindings(gMapVM, document.getElementById('googleMap'));
    ko.applyBindings(streetviewVM, document.getElementById('top'));
    ko.applyBindings(nytVM, document.getElementById('nytimes'));
    ko.applyBindings(twitterVM, document.getElementById('twitter'));
    ko.applyBindings(flickrVM, document.getElementById('flickr'));
}