// To do: On small screens, lower circle radius and hide zoom controls
(function() {
  "use strict";

  var
  map,
  mapID     = "map-midsize-cities",
  mapBase   = "mdavidmorton.1a369aeb",
  publicKey = "pk.eyJ1IjoibWRhdmlkbW9ydG9uIiwiYSI6ImNpZzN5cDZyNTI3czJ1c201cjlvMjh4OWQifQ.CGZjS_17LA9FrdS92dMUow",
  url       = document.getElementById(mapID).dataset.source
  ;

  drawMap();
  getJSONData(url, addDataToMap);
  
  function getJSONData(url, callback) {
    var request = new XMLHttpRequest();
    request.open("GET", url, true);

    request.onload = function() {
      if (request.status >= 200 && request.status < 400) {
        callback(JSON.parse(request.responseText));
      } else {
        console.log(null, new Error("Request failed: " + request.statusText));
      }
    };

    request.onerror = function() {
      console.log(null, new Error("Network connection error"));
    };

    request.send();
  }

  function drawMap() {
    // Set zoom level for device width
    var defaultZoom  = (window.innerWidth > 640) ? 4 : 3;
    var zoomControls = (window.innerWidth > 640) ? true : false;
    
    L.mapbox.accessToken = publicKey;

    map = L.mapbox.map(mapID, mapBase, {
      
      scrollWheelZoom: false,
      minZoom: 3,
      maxZoom: 5
    }).setView([39.833333333333336,-98.58333333333333], defaultZoom);

    // What a hack, this one ... 
    if (!zoomControls) {
      document.querySelector(".leaflet-control-container").style.display = 'none';
    }
  }

  function addDataToMap(data) {
    var points = L.mapbox.featureLayer(data, {
      pointToLayer: function(feature, latlon) {
        return L.circleMarker(latlon, {
          fillColor: "#0961ae",
          fillOpacity: 0.5,
          stroke: false,
          radius: feature.properties.population * .000025 // Use +("123,000".split(",").join("")); to convert string to integer
        });
      }
    }).addTo(map);

    bindPopups(points);
  }

  function bindPopups(points) {
    points.eachLayer(function(item) {
      var prop = item.feature.properties;

      // Popup HTML
      var popup = "<p class='text-strong'>" + prop.title + "</p>";
      popup += "<p><small>"
      popup += "Population: " + prop.population + "<br>";
      popup += "Living below poverty line: " + Math.round(prop.pctBelowPoverty * 100) + "%<br>";
      popup += "Median age: " + Math.round(prop.medianAge) + "<br>";
      popup += "Mean travel time: " + Math.round(prop.meanTravelTimeMinutes) + " minutes";
      popup += "</small></p>"

      
      // Add additional properties here

      // On item click, bind popup HTML
      item.on("click", function(e) {
        console.log(prop.pctBelowPoverty);
        item.bindPopup(popup);
      });
    });
  }
})();