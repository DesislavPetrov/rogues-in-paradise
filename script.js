/* This will let you use the .remove() function later on */
if (!("remove" in Element.prototype)) {
  Element.prototype.remove = function () {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  };
}

mapboxgl.accessToken =
  "pk.eyJ1IjoiaXJjbGF5IiwiYSI6ImNsc3FjanRnODEyaW0yaW4xNzUwdzF1bWoifQ.KYsanfK-Kd_ENwSqTCmwSg";

/**
 * Add the map to the page
 */
var map = new mapboxgl.Map({
  center: [-59.543198, 13.193887	],
  container: "map",
  style: "mapbox://styles/irclay/clsu6ok0r00si01qwhokr3cua",
  zoom: 10.5,
  customAttribution:
    '<a target="_blank" href=https://www.geocadder.bg/en>geocadder</a>',
});

var markersCoordinates = [];

var nav = new mapboxgl.NavigationControl({
  showCompass: false,
});
map.addControl(nav, "top-left");

// disable map rotation using right click + drag
map.dragRotate.disable();

// disable map rotation using touch rotation gesture
map.touchZoomRotate.disableRotation();

/**
 * Wait until the map loads to make changes to the map.
 */
map.on("load", function (e) {
  $.getJSON(
    "https://sheets.googleapis.com/v4/spreadsheets/1OqX8WvpNIgbwYQaIm7qoNuJREZcNEki4CKPCAZicfnc/values/Sheet1!A2:Z1000?majorDimension=ROWS&key=AIzaSyBDYV5iGK3gcKZyPvTRJiscHDWj-js-p8M",
    function (stores) {
      stores.values.forEach(function (store, i) {
        store[0] = i; // here is the Id of the store
        markersCoordinates.push([store[5], store[4]]);
      });

      // fit bounds to all markers
      var bounds = markersCoordinates.reduce(function (bounds, coord) {
        return bounds.extend(coord);
      }, new mapboxgl.LngLatBounds(
        markersCoordinates[5],
        markersCoordinates[4]
      ));

      map.fitBounds(bounds, {
        padding: 20,
      });


      /**
       * Add all the things to the page:
       * - The location listings on the side of the page
       * - The search box (MapboxGeocoder) onto the map
       * - The markers onto the map
       */
      buildLocationList(stores);
      // map.addControl(geocoder, 'top-left');
      addMarkers();

      

      /**
       * Add a marker to the map for every store listing.
       **/
      function addMarkers() {
        /* For each feature in the GeoJSON object above: */
        stores.values.forEach(function (marker) {
          var bookIcon = "url(icons/" + marker[3] + ".svg)"; // this is the chapter of the book
          /* Create a div element for the marker. */
          var el = document.createElement("div");
          /* Assign a unique `id` to the marker. */
          el.id = "marker-" + marker[0];
          /* Assign the `marker` class to each marker for styling. */
          el.className = "marker";
          el.style.backgroundImage = bookIcon;

          el.style.width = "50px";
          el.style.height = "50px";

          /**
           * Create a marker using the div element
           * defined above and add it to the map.
           **/

          console.log(marker[5] + " " + marker[4])
          new mapboxgl.Marker(el, { offset: [0, -23] })
            .setLngLat([marker[5], marker[4]])
            .addTo(map);

          el.addEventListener("click", function (e) {
            flyToStore(marker);
            createPopUp(marker);
            var activeItem = document.getElementsByClassName("active");
            e.stopPropagation();
            if (activeItem[0]) {
              activeItem[0].classList.remove("active");
            }
            var listing = document.getElementById("listing-" + marker[0]);
            listing.classList.add("active");
          });
        });
      }
    }
  );
});


/**
 * Add a listing for each store to the sidebar.
 **/
function buildLocationList(data) {
  data.values.forEach(function (store, i) {
    /**
     * Create a shortcut for `store.properties`,
     * which will be used several times below.
     **/
    // var prop = store.values;

    /* Add a new listing section to the sidebar. */
    var listings = document.getElementById("listings");
    var listing = listings.appendChild(document.createElement("div"));
    /* Assign a unique `id` to the listing. */
    listing.id = "listing-" + store[0];
    /* Assign the `item` class to each listing for styling. */
    listing.className = "item";

    /* Add the link to the individual listing created above. */
    var link = listing.appendChild(document.createElement("a"));
    link.href = "#";
    link.className = "title";
    link.id = "link-" + store[0];

   
    link.innerHTML =
      store[1] + '<br><img src="icons/' + store[3] + '.svg" class="industry-logo">';

    /* Add details to the individual listing. */
    var details = listing.appendChild(document.createElement("div"));
    
    if (store[11]) {
      var roundedDistance = Math.round(store[11] * 100) / 100;
      details.innerHTML +=
        "<p><strong>" + roundedDistance + " miles away</strong></p>";
    }

    /**
     * Listen to the element and when it is clicked, do four things:
     * 1. Update the `currentFeature` to the store associated with the clicked link
     * 2. Fly to the point
     * 3. Close all other popups and display popup for clicked store
     * 4. Highlight listing in sidebar (and remove highlight for all other listings)
     **/
    link.addEventListener("click", function (e) {
      for (var i = 0; i < data.values.length; i++) {
        if (this.id === "link-" + data.values[i][0]) {
          var clickedListing = data.values[i];
          flyToStore(clickedListing);
          createPopUp(clickedListing);
        }
      }
      var activeItem = document.getElementsByClassName("active");
      if (activeItem[0]) {
        activeItem[0].classList.remove("active");
      }
      this.parentNode.classList.add("active");
    });
  });
}

/**
 * Use Mapbox GL JS's `flyTo` to move the camera smoothly
 * a given center point.
 **/
function flyToStore(currentFeature) {
  map.flyTo({
    center: [currentFeature[5], currentFeature[4]],
    zoom: 15,
  });
}

/**
 * Create a Mapbox GL JS `Popup`.
 **/
function createPopUp(currentFeature) {
  var popUps = document.getElementsByClassName("mapboxgl-popup");
  if (popUps[0]) popUps[0].remove();

  console.log(currentFeature[0]);
  console.log(currentFeature[5])

  var popup = new mapboxgl.Popup({ closeOnClick: false })
    .setLngLat([currentFeature[5], currentFeature[4]])
    .setHTML(
      "<h3>" +
        currentFeature[3] +
        ". " + currentFeature[1] + "</h3>" +
        "<p>" +
        currentFeature[2] +
        "</p><p class='website'><a target='_blank' href='https://roguesinparadise.com'>roguesinparadise.com</a>"
    )
    .addTo(map);
}

// close all opened popups
$(".marker").click(function () {
    $(".mapboxgl-popup").remove();
  });
  
  $(".mapboxgl-canvas").click(function () {
    console.log("desi");
    $(".mapboxgl-popup").remove();
  });
  // end closing all popups
