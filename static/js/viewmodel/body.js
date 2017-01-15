var bodyViewModel = function() {
    self = this;
    self.ready = ko.observable(false);
    postbox.subscribe(function(newValue) {
        self.ready(newValue);
    }, this, "ready");
};

var bodyVM = new bodyViewModel();