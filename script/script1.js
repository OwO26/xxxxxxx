mapboxgl.accessToken = 'your_mapbox_access_token';
    
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11',
  center: [-0.039800, 51.515600],
  zoom: 12.55
});

fetch('data/comm_4326_new.geojson')
  .then(response => response.json())
  .then(data => {
    map.addSource('committee-sites', {
      type: 'geojson',
      data: data
    });

    map.addLayer({
      id: 'committee-sites-layer',
      type: 'fill',
      source: 'committee-sites',
      paint: {
        'fill-color': '#007cbf',
        'fill-opacity': 0.3
      }
    });

    const siteButtons = document.getElementById("siteButtons");
    data.features.forEach(feature => {
      let btn = document.createElement("button");
      btn.textContent = feature.properties.name;
      btn.onclick = () => flyToLocation(feature);
      siteButtons.appendChild(btn);
    });

    function flyToLocation(feature) {
      map.flyTo({
        center: feature.geometry.coordinates[0][0][0],
        zoom: 16,
        essential: true
      });
      showSiteInfo(feature.properties);
    }

    function showSiteInfo(properties) {
      let details = `<h3>${properties.name}</h3>`;
      JSON.parse(properties.applications).forEach(app => {
        details += `<p><strong>${app.application_number}</strong> (${app.committee_date})<br>${app.result}</p>`;
      });
      document.getElementById("infoContent").innerHTML = details;
    }

    map.on('click', 'committee-sites-layer', (e) => {
      if (e.features.length) {
        showSiteInfo(e.features[0].properties);
      }
    });
  })
  .catch(error => console.error("Error loading GeoJSON:", error));
