function streetViewViewModel() {
    var self = this;
    self.sv = ko.observable({
        streetview: ko.observable("https://farm8.staticflickr.com/7705/16555879314_3dff3d0904_k.jpg"),
        geocode: ko.observable('')
    });

    self.ready = ko.observable(false);

    postbox.subscribe(function(newValue) {
        self.ready(newValue);
    }, this, "ready");


    self.error = ko.observable(false);
    postbox.subscribe(function(newValue) {
        self.error(newValue);
    }, this, "error");

    self.pad = ko.computed(function() {
        return self.error() ? '0px' : '30px';
    }, this);

    self.col = ko.computed(function() {
        return self.ready() ? '#FFF' : 'inherit'
    })

}

ko.bindingHandlers.streetView = {
    init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        // This will be called when the binding is first applied to an element
        // Set up any initial state, event handlers, etc. here

        svObj = ko.utils.unwrapObservable(valueAccessor());

        postbox.subscribe(function(newValue) {
            svObj.geocode(newValue);
        }, this, "geocode");
    },
    update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        // This will be called once when the binding is first applied to an element,
        // and again whenever any observables/computeds that are accessed change
        // Update the DOM element based on the supplied values here.
        // NYT api

        if (svObj.geocode()) {
            var bgimgUrl = 'https://maps.googleapis.com/maps/api/streetview?size=640x300&key=AIzaSyByEqDgf-PRFLEuJxP7vVNIsmVIofdd79U&location=' + mapObj.geocode();

            svObj.streetview(bgimgUrl);
        }
    }
};


function onclickTo() {
    $('body').css({'overflow':''});
}

function onsubmitTo() {
    console.log("Do not press enter");
}

ko.virtualElements.allowedBindings.streetView = true;

var streetviewVM = new streetViewViewModel();
