$(document).ready(function() {
	
	// Google API Key = AIzaSyAxYJTC2MrJe_f-6b53TiaaHjonWC0EPxg
	
	// Flickr key
	var key = "a86e25fd6e699aad4601106467321bf3";
	
	// Your LINZ Data Service API Key
	var ldsApiKey = "e37f7e03afd44129b1186e7f7640effb";
	
	// The Layer ID of the layer we're querying
	var ldsLayerID = 364;
	// Maximum number of results to be returned (1-100)
	var maxResults = 100;
	// Latitude of map centre
	var latitudeCentre = -36.977587;
	// Longitude of map centre
	var longitudeCentre = 174.528961;
	// Array of all tracks returned from API
	var myTracks = [];
	
	//Adds a message to the `messageNode`
	var logMessage = function(text) {
		var newNode = $('<li>');
		newNode.text(text);
		$('#messages').append(newNode);
	}

	// Find a track using its ID, and return that track object
	var getTrackByID = function(id){
		for (var i = 0; i < myTracks.length; i++) {
			if (myTracks[i].id == id) {
				return myTracks[i];
			}
		}
	}
		
	// Saves geographical data obtained from LINZ API call to be used later
	var processData = function(data) {
		// Loop through all tracks and store all non-null-named tracks in an array of objects
		for (var i = 0, j = 0; i < maxResults; i++) {
			// Name of track from API
			var trackName = data.vectorQuery.layers["364"].features[i].properties.name;
			// Array of track coordinates from API
			var trackCoordinates = data.vectorQuery.layers["364"].features[i].geometry.coordinates;
			// Check if track has a name
			if (trackName != null) {
				var totalLength=0;
				distanceToWalk=lengthOfWalk(realLat,realLon,trackCoordinates[0][0],trackCoordinates[0][1]);
				// Find total length of track in km
				for (var z = 0; z < trackCoordinates.length-1; z++) { 
					var ArrayLat=new Array(trackCoordinates.length);
					var ArrayLong=new Array(trackCoordinates.length);
					ArrayLat[z]=trackCoordinates[z][0];
					ArrayLong[z]=trackCoordinates[z][1];
					ArrayLat[z+1]=trackCoordinates[z+1][0];
					ArrayLong[z+1]=trackCoordinates[z+1][1];
					var x=lengthOfWalk(ArrayLat[z],ArrayLong[z],ArrayLat[z+1],ArrayLong[z+1]);
					totalLength=totalLength+x;
				}		
				// Calculate estimate of time taken to walk the track
				var walkingTime = totalLength/0.036;
				// Save track objects with associated variables
				var track = {
					id: j,
					name: trackName,
					coordinates: trackCoordinates,
					trackLength: totalLength,
					timeInMinutes: walkingTime,
					distanceToWalk: distanceToWalk
				};
				myTracks.push(track);
				j++;
			}
		}
	}
		
	// Filters out 'null' named tracks and displays the name of all other tracks
	var displayData = function() {
		var $walks = $("#walks");
		for (var i = 0; i < myTracks.length; i++) {
			// Name of track from API call
			var trackName = myTracks[i].name;
			var trackID = myTracks[i].id;	
			var trackLatitude = myTracks[i].coordinates[0][1];
			var trackLongitude = myTracks[i].coordinates[0][0];
			var trackLength = myTracks[i].trackLength;
			// If track does not have a name, ignore it
			if (trackName != null) {
				getPhoto(trackName, trackLatitude, trackLongitude, 1, trackID); 
			}
		}
		// On clicking an image of the track on the main page, bring up a plot of the track on google maps and retrieve more images of the track from Flickr
		$(document).on("click", "#walks a", function(ev) {
			ev.preventDefault();
			var track = getTrackByID($(this).data("track-id"));
			var $walkInfo = $("<div id='walk-info-wrapper'></div>");
			var $firstPanel = $("<div id='first-panel'></div>");
			var $secondPanel = $("<div id='second-panel'></div>");
			var $extraInfo = $("<div id='extra-info'></div>");
			$secondPanel.append("<div id='map-title'>Where to Go</div>");
			$firstPanel.append("<div id='track-name'>" + track.name + "</div>");
			$firstPanel.append("<div class='main-gallery'></div>");
			$extraInfo.append("<p>Duration: " + parseInt(track.timeInMinutes) + " minutes</p>");
			$extraInfo.append("<p>From your location: " + track.distanceToWalk.toFixed(1) + "km</p>");
			$extraInfo.append("<p>Distance: " + track.trackLength.toFixed(1) + "km</p>");
			$firstPanel.append($extraInfo);
			$walkInfo.append("<a id='closeButton'>&times;</a>");
			$secondPanel.append("<div id='map-container'><div id='map-canvas'></div></div>");
			$walkInfo.append($firstPanel);
			$walkInfo.append($secondPanel);
			getPhotos(track.name, track.coordinates[0][1], track.coordinates[0][0], track.id); 
			$("#walk-info").prepend($walkInfo);
			showMap($(this).data("track-id"));
			$("#walkland").removeClass("walkland-first");
			$("#walkland").addClass("walkland-second");
			$("body").addClass("detail");
			$("#walk-info").removeClass("hidden");
		});
		// On clicking the 'X' in the top right hand corner of the 2nd page, return back to the 1st page
		$(document).on("click", "#closeButton", function(ev) {
			ev.preventDefault();
			$(this).parent().remove();
			$("#walkland").removeClass("walkland-second");
			$("#walkland").addClass("walkland-first");
			$("body").removeClass("detail");
			$("#walk-info").addClass("hidden");
		});
	}

	// Initialises Flickr API call to return images of the selected image
	var getPhoto = function(walkwayName,latitude,longitude,numberOfPhotos, trackID){

		$.getJSON('https://api.flickr.com/services/rest/?&method=flickr.photos.search&text="' + walkwayName + '"&format=json&api_key=' + key + '&per_page=' + numberOfPhotos + '&lat=' + latitude + '&lon=' + longitude + '&radius=30&radius_units=km&extras=url,geo&has_geo=1&jsoncallback=?',function(data){
			var $walks = $("#walks");
			 
			$.each(data.photos.photo, function(index, photo) {
				var imageString = "https://farm" + photo.farm + ".staticflickr.com/" + photo.server + "/" + photo.id + "_" + photo.secret + ".jpg";
				//$walks.append("<li><a href='#' data-track-id='" + trackID + "'> <img src='https://farm" + photo.farm + ".staticflickr.com/" + photo.server + "/" + photo.id + "_" + photo.secret + ".jpg" + "'/> </a></li>");
				var $walk = $("<a href='#' data-track-id='" + trackID + "'> <img alt='" + walkwayName + "' src='" + imageString + "'/></a>");
				//$walk.find("a").attr(imageString);
				$walks.append($walk);
				$("#walks").justifiedGallery({
					rowHeight : 200,
					margins : 8
				});
			});
		})
	}
	
	var getPhotos = function(walkwayName,latitude,longitude, trackID){

		$.getJSON('https://api.flickr.com/services/rest/?&method=flickr.photos.search&text="' + walkwayName + '"&format=json&api_key=' + key + '&per_page=10&lat=' + latitude + '&lon=' + longitude + '&radius=30&radius_units=km&extras=url,geo&has_geo=1&jsoncallback=?',function(data){
			var $walks = $("#walks");
			 
			$.each(data.photos.photo, function(index, photo) {
				var imageString = "https://farm" + photo.farm + ".staticflickr.com/" + photo.server + "/" + photo.id + "_" + photo.secret + ".jpg";
				var $photo = $("<div class='image-wrapper'><img class=\"gallery-cell\" src='" + imageString + "'></div>");
				$photo.find("a").css("background-image",imageString);
				$(".main-gallery").append($photo);
			});
			$('.main-gallery').flickity({
					// options
					setGallerySize:false,
					imagesLoaded:true,
					cellAlign:'center'
			});
		})
	}
	
	// Create GET request to return track info from LINZ Data Service
	var requestName = function(lat, lon) {
		// Create the Deferred object
		var deferred = $.Deferred();
		// These are our query string parameters for the API call
		var params = {
			"key": ldsApiKey,
			"layer": ldsLayerID,
			// Currently latitude and longitude are hard-coded to be set within the Waitakere region to return more results
			"x": longitudeCentre,
			"y": latitudeCentre,
			"max_results": maxResults,
			"radius": 100000,
			"geometry": true,
			"with_field_names": true
		}

		// Initiate the request *asyncronously*
		var request = $.get("http://api.data.linz.govt.nz/api/vectorQuery.json", params);
		
		// Add a success handler, a function to be called when the API returns a successful result
		request.done(
			function(data) {
				// Process data from API here
				processData(data);
				displayData(data);
			}
		);

		// Add a failure handler, a function to be called when the API rejects the request
		request.fail(
			function() {
				// When the request fails, we reject the deferred object
				deferred.reject()
			}
		);
		// Return the deferred, it will "resolve" or "reject" when the a result is available.
		return deferred;
	}
	
	var realLat;
	var realLon;
		
	// Function to get the current geolocation of the user	
		navigator.geolocation.getCurrentPosition(function(position) {
			logMessage("Got current position, querying data...");
		realLon=position.coords.latitude;
		realLat=position.coords.longitude;
			// Request the elevation, the function returns a deferred object
			var deferred = requestName(position.coords.latitude, position.coords.longitude);
		});
		
	// Allows us to find the length of the track by calculating the distance between all of the track coordinates
	function lengthOfWalk(lat1, lon1, lat2, lon2) {
		var R = 6371;
		var a =  0.5 - Math.cos((lat2 - lat1) * Math.PI / 180)/2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * (1 - Math.cos((lon2 - lon1) * Math.PI / 180))/2;
		return R * 2 * Math.asin(Math.sqrt(a));
	}
		
	// Create custom-styled google map and plot the track coordinates on it
	function showMap(trackID) {
		var track = getTrackByID(trackID);		
		var mapOptions = {
			center: { lat: track.coordinates[0][1], lng: track.coordinates[0][0] },
			zoom: 13,
			mapTypeControl: false,
			mapTypeId: "walkland"
		};
		
		// Custom map style
		var mapStyles = [
			{
				"featureType": "all",
				"elementType": "labels.text.stroke",
				"stylers": [
					{
						"visibility": "on"
					},
					{
						"weight": "2.55"
					},
					{
						"color": "#ffffff"
					}
				]
			},
			{
				"featureType": "landscape",
				"elementType": "geometry",
				"stylers": [
					{
						"color": "#4caf50"
					}
				]
			},
			{
				"featureType": "landscape.man_made",
				"elementType": "geometry",
				"stylers": [
					{
						"visibility": "on"
					}
				]
			},
			{
				"featureType": "landscape.natural.landcover",
				"elementType": "geometry",
				"stylers": [
					{
						"visibility": "on"
					},
					{
						"color": "#509362"
					}
				]
			},
			{
				"featureType": "landscape.natural.terrain",
				"elementType": "geometry",
				"stylers": [
					{
						"visibility": "on"
					},
					{
						"hue": "#00ff0c"
					}
				]
			},
			{
				"featureType": "poi",
				"elementType": "geometry",
				"stylers": [
					{
						"visibility": "simplified"
					},
					{
						"hue": "#00ff08"
					}
				]
			},
			{
				"featureType": "poi.park",
				"elementType": "geometry",
				"stylers": [
					{
						"color": "#388e3c"
					}
				]
			},
			{
				"featureType": "water",
				"elementType": "geometry",
				"stylers": [
					{
						"color": "#8fceec"
					}
				]
			}
		];
		
		// Create google map object
		var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
		map.mapTypes.set("walkland", new google.maps.StyledMapType(mapStyles, {name: "walkland-style"}));
		var flightPlanCoordinates = [];
		
		for (var i = 0; i < track.coordinates.length; i++){
			flightPlanCoordinates[i] = new google.maps.LatLng(track.coordinates[i][1], track.coordinates[i][0]);
		}
		
		// Plot the track coordinates on the map
		var flightPath = new google.maps.Polyline({
			path: flightPlanCoordinates,
			geodesic: true,
			strokeColor: '#FF0000',
			strokeOpacity: 1.0,
			strokeWeight: 2
		});
		flightPath.setMap(map);
		google.maps.event.addListenerOnce(map, 'idle', function() {
		google.maps.event.trigger(map, 'resize');
		map.setCenter(flightPlanCoordinates[0]);
		});
	}
});