//Create an array to store all location data
var locations = [{
	name : 'San Francisco'
},{
	name : 'San Jose'
},{
	name : 'Sacramento'
},{
	name : 'Reno'
},{
	name : 'Los Angeles'
},{
	name : 'Las Vegas'
},{
	name : 'Long Beach'
},{
	name : 'Bakersfield'
}];

var Location = function(data, object) {
	this.name = data.name;
	this.marker = object;
};

var locationList; //knockout observable array  to store locations
var markers = [];//array to store marker object
var infoWindows = [];//array to store infoWindow object
var locationObjects = [];

//function to initialize the google map
function initializeMap() {
  ko.applyBindings(new ViewModel());

  var locations;

  var mapOptions = {
    disableDefaultUI: true
  };


  map = new google.maps.Map($('#map')[0], mapOptions);
  var infoWindow = new google.maps.InfoWindow({});


  /*
  createMapMarker(placeData) reads Google Places search results to create map pins.
  placeData is the object returned from search results containing information
  about a single location.
  */
  function createMapMarker(placeData) {

    // The next lines save location data from the search result object to local variables
    var lat = placeData.geometry.location.lat();  // latitude from the place service
    var lon = placeData.geometry.location.lng();  // longitude from the place service
    var name = placeData.formatted_address;   // name of the place from the place service
    var bounds = window.mapBounds;            // current boundaries of the map window
    var locname = name.split(",")[0];

    // marker is an object with additional data about the pin for a single location
    var marker = new google.maps.Marker({
      map: map,
      position: placeData.geometry.location,
      title: name,
      animation: google.maps.Animation.DROP
    });

    markers.push(marker); //add marker to markers array

    // infoWindows are the little helper windows that open when you click
    // or hover over a pin on a map.


    infoWindows.push(infoWindow);//add infoWindow to infoWindows array

    //function to set animation bounce or null on marker
    function toggleBounce(marker) {
    	if (marker.getAnimation() !== null) {
    		marker.setAnimation(null);
  		} else {
    	marker.setAnimation(google.maps.Animation.BOUNCE);
  		}
	}


	var infoContent;

	//function to get infomations about the location from wiki api by ajax (jsonp).
	Location.prototype.getInfo = function(name){
  		var wikiUrl = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' + name + '&format=json&callback=wikiCallback';
    	//handle the error when browser don't get infomation
    	// var wikiRequestTimeout = setTimeout(function(){
     //    	infoContent = "failed to get wikipedia resources";
     //    	infoWindow.setContent(infoContent);
    	// 	}, 8000);

    	$.ajax({
        	url: wikiUrl,
        	dataType: "jsonp",
        	jsonp: "callback",
        }).done(function( response ) {
            	var url = response[3][0];
            	var articleLink;
            	if (url !== "") {
            		articleLink = '<a target="_blank" href=' + url + '>' + name + '</a>';
            	} else {
            		articleLink = name;
            	}
            	var article = response[2][0];
            	if (article === "") {
            		if (response[2][1] !== "") {
            			article = response[2][1];
            		} else {
            			article = "No data available!";
            		}
            	}
            	infoContent = articleLink + "<br>" + "<p>" + article + "</p>";
            	//clearTimeout(wikiRequestTimeout);  //if ajax request is success,clear the setTimeout function
            	infoWindow.setContent(infoContent);
        }).fail(function(){
        		infoContent = "failed to get wikipedia resources";
        		infoWindow.setContent(infoContent);
        });
  	}


    //add click listener to marker object
    google.maps.event.addListener(marker, 'click', function() {
      //when marker is clicked, set animation and open an infoWindow with data from wiki by ajax
      map.setCenter(marker.getPosition());
      markers.forEach(function(marker){
      	if(marker.getAnimation() !== null) {
    		marker.setAnimation(null);
  		}
      });
      toggleBounce(marker);
      // infoWindows.forEach(function(infoWindow){
      // 	infoWindow.close();
      // });
      infoWindow.setContent("loading...");
      infoWindow.open(map,marker);
      getInfo(locname);

    });

    // this is where the pin actually gets added to the map.
    // bounds.extend() takes in a map location object
    bounds.extend(new google.maps.LatLng(lat, lon));
    // fit the map to the new marker
    map.fitBounds(bounds);
    // center the map
    map.setCenter(bounds.getCenter());

    var locelem = new Location(locname, marker);
    locationObjects.push(locelem);
  }

  /*
  callback(results, status) makes sure the search returned results for a location.
  If so, it creates a new map marker for that location.
  */
  function callback(results, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
      createMapMarker(results[0]);
    }
  }

  /*
  pinPoster(locations) takes in the array of locations created by locationFinder()
  and fires off Google place searches for each location
  */
  function pinPoster(locations) {

    // creates a Google place search service object. PlacesService does the work of
    // actually searching for location data.
    var service = new google.maps.places.PlacesService(map);

    // Iterates through the array of locations, creates a search object for each location
      ko.utils.arrayForEach(locations,function(elem){
      // the search request object
      var request = {
        query: elem.name
      };

      // Actually searches the Google Maps API for location data and runs the callback
      // function with the search results after each search.
      service.textSearch(request, callback);
    });
  }

  // Sets the boundaries of the map based on pin locations
  window.mapBounds = new google.maps.LatLngBounds();

  // locations is an array of location strings returned from locationFinder()
  var allLocation = locationList();

  // pinPoster(locations) creates pins on the map for each location in
  // the locations array
  pinPoster(allLocation);

}

// Vanilla JS way to listen for resizing of the window
// and adjust map bounds
window.addEventListener('resize', function(e) {
  //Make sure the map bounds get updated on page resize
  map.fitBounds(mapBounds);
});


//function to create location object

//ViewModel initialize locationList which is display on page
var ViewModel = function() {
	var self = this;
	self.searchValue = ko.observable("");

	locationList = ko.computed(function(){
		var matchs = [];
		var filterList = [];
		filterNameList = [];
		locations.forEach(function(elem){
			if (self.searchValue() === "") {
				filterList = locations.slice();
				filterNameList.push(elem.name);
			}
			else if (elem.name.toLowerCase().indexOf(self.searchValue().toLowerCase()) !== -1) {
				filterList.push(elem);
				filterNameList.push(elem.name);
			}
		});
		filterList.forEach(function(elem){
			matchs.push(new Location(elem));
		});
		return matchs;
	});

	//update markers on map when input change
	self.filterMarker = function() {
		markers.forEach(function(marker){
			marker.setVisible(true);
			if(filterNameList.indexOf(marker.getTitle().split(',')[0]) === -1) {
				marker.setVisible(false);
			}
		});
	};

	//handle function on locationList elem click event
	this.setMarker = function() {
		var selected = this.name;
		markers.forEach(function(marker){
			if(marker.getTitle().split(',')[0] == selected){
				google.maps.event.trigger(marker,'click'); //trigger marker click event
			}
		});
	};

	//when filter word(on page) is clicked ,show the sideBox
	this.sideBoxIn = function() {
		$('#sideBox').css('left',0);
		$('#mask').fadeIn();
	};

	//click on shadow , hide the sideBox
	this.sideBoxOut = function() {
		$('#sideBox').css('left', "-300px");
		$('#mask').fadeOut();
	};
};

function MapLoadError() {
    alert('Failed to initialize the Google Maps API');
}
