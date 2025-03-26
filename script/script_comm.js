/*
    Copyright (c) 2025 LBTH DDC&IU
    Created: 07 Feb 2025
    Description: committee site tracker js page for DDC&UI Products
    License: All Rights Reserved.

    This code is proprietary and confidential. Unauthorized distribution or modification outside of the authorized team is prohibited.

    Modification Rules:
    - DDC&IU Team members may modify the code but must document their changes in the Change Log.
    - External parties are not permitted to use, modify, or distribute this code.


    Change Log:
    - 07 Feb 2025: Initial creation (with reference style) (Jiayan Fan)
    - 13 Feb 2025: Modify title and navigation bar (modifier: Jiayan Fan)
    - 19 Feb 2025: Code framework modification (modifier: Jiayan Fan)
*/

// Mapbox token
mapboxgl.accessToken = 'pk.eyJ1Ijoiam9qb293byIsImEiOiJjbDM0Y21naDQwMWN1M2VydTY1eGZtdWVkIn0.APwfMOnQ-yVNb5bC0H7Apw';

// Initialise the map
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/jojoowo/cm6s54ywb015501pbd6ww0pwr',
  center: [-0.039800, 51.515600],
  zoom: 12.66,
  pitch: 0,
  bearing: 0
});

function add3DBuildings() {
  if (!map.getLayer('3d-buildings')) {
    map.addLayer({
      id: '3d-buildings',
      source: 'composite',
      'source-layer': 'building',
      type: 'fill-extrusion',
      minzoom: 15,
      paint: {
        'fill-extrusion-color': [
          'case',
          ['boolean', ['feature-state', 'inPolygon'], false],
          '#e06c00', // orange
          '#ddd'     // default
        ],
        'fill-extrusion-height': [
          "interpolate", ["linear"], ["zoom"],
          15, 0,
          16, ["get", "height"]
        ],
        'fill-extrusion-opacity': 0.7
      }
    });
  }
}

map.on('click', '3d-buildings', (e) => {
    if (e.features.length) {
        const feature = e.features[0];  // click and gain the building feature
        console.log('🛠️ Click Building Feature:', feature);
        
        //  Feature ID
        if (feature.id) {
            console.log('🏗️ Building ID:', feature.id);
        } else {
            console.log('⚠️ Building without ID');
        }
        
        console.log('📌 Feature of this building:', feature.properties);
    }
});

// Add layers, click event listeners, and status updates after the map is loaded

let locations = {}; 

function loadCSVData() {
  return new Promise((resolve, reject) => {
    Papa.parse("data/comm/site_info.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.error("CSV cannot open:", results.errors);
          reject(new Error("CSVformat wrong: " + results.errors[0].message));
          return;
        }

        try {
          locations = results.data.reduce((acc, row, index) => {
            // MODIFIED: handel CSV
            const requiredFields = ['key', 'button', 'feature', 'center', 'zoom', 'info', 'geometry'];
            requiredFields.forEach(field => {
              if (!(field in row)) throw new Error(`no. ${index + 1} row: lost ${field} string`);
            });

            // MODIFIED: trans
            const geometryCoords = parseGeometry(row.geometry);
            const center = parseCenter(row.center);
            const featureIds = parseFeatureIds(row.feature);

            acc[row.key] = {
              center: center,
              zoom: Number(row.zoom) || 16,
              info: formatHTMLContent(row.info),
              geometry: { 
                type: "MultiPolygon", 
                coordinates: geometryCoords 
              },
              featureIds: featureIds
            };
            return acc;
          }, {});
          resolve();
        } catch (err) {
          console.error("Trans failed:", err.message);
          reject(err);
        }
      },
      error: (err) => {
        console.error("CSV loading failed:", err);
        reject(err);
      }
    });
  });
}

async function loadCSVDataAndGenerateButtons() {
  try {
    await loadCSVData();
    generateButtons(); 
  } catch (err) {
    console.error("data loading failed:", err);
  }
}

function generateButtons() {
  const siteControl = document.getElementById('siteControl');
  siteControl.innerHTML = '';

  Object.entries(locations).forEach(([key, site]) => {
    if (!site || !site.info) return;

    const button = document.createElement('button');
    button.textContent = site.info.button || key.replace(/_/g, ' ');
    button.onclick = () => flyToLocation(key);
    
    siteControl.appendChild(button);
  });

  console.log("🚀 botton done", Object.keys(locations));
}

map.on('load', async () => {
  await loadCSVDataAndGenerateButtons();
});


// MODIFIED: geo
function parseGeometry(geometryStr) {
  try {
    const cleaned = geometryStr
      .replace(/^"+|"+$/g, '') 
      .replace(/'/g, '"');
    const coordinates = JSON.parse(cleaned);
    
    if (!Array.isArray(coordinates) || 
        coordinates.some(poly => !Array.isArray(poly)) ||
        coordinates[0][0].some(coord => !Array.isArray(coord))) {
      throw new Error("Geometry wrong");
    }
    return coordinates;
  } catch (err) {
    throw new Error("Geometry frormat wrong: " + err.message);
  }
}

function parseCenter(centerStr) {
  try {
    // clean csv
    const cleaned = centerStr
      .replace(/^"+|"+$/g, '') 
      .replace(/'/g, '"'); 
    const center = JSON.parse(cleaned);
    
    if (!Array.isArray(center) || 
        center.length !== 2 ||
        typeof center[0] !== 'number' || 
        typeof center[1] !== 'number') {
      throw new Error("Center format must be [lng, lat]");
    }
    return center;
  } catch (err) {
    throw new Error("Center format wrong: " + err.message);
  }
}

// MODIFIED: id
function parseFeatureIds(featureStr) {
  try {
    // 完整清理流程
    const cleaned = featureStr
      .replace(/^"+|"+$/g, '')
      .replace(/\s/g, '')
      .replace(/[”“]/g, '')
      .replace(/","/g, ',')
      .replace(/(\d),(\d)/g, '$1,$2');

    return cleaned.split(',')
      .filter(id => id !== '')
      .map(id => {
        const num = Number(id);
        if (isNaN(num)) {
          console.error('⚠️ wrong Feature ID:', id, 'string is:', featureStr);
          throw new Error(`Feature ID must be a nummber: ${id}`);
        }
        return num;
      });
  } catch (err) {
    throw new Error("Feature ID wrong: " + err.message);
  }
}
// html
function formatHTMLContent(rawHTML) {
  return rawHTML
    .replace(/\r\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\n\s+/g, '\n');
}


async function addExtrudedBuildings() {
  if (!locations || Object.keys(locations).length === 0) {
      console.error("❌ No locations found, cannot extrude buildings.");
      return;
  }

  Object.entries(locations).forEach(([key, site]) => {
      if (!site.geometry) return;

      map.addSource(`${key}-extrusion`, {
          type: 'geojson',
          data: {
              type: 'Feature',
              geometry: site.geometry,
              properties: {}
          }
      });

      map.addLayer({
          id: `${key}-extrusion-layer`,
          type: 'fill-extrusion',
          source: `${key}-extrusion`,
          paint: {
              'fill-extrusion-color': '#ff9a3b',
              'fill-extrusion-height': 100,
              'fill-extrusion-opacity': 0.3
          }
      });
  });

  console.log("✅ Extruded buildings added.");
}


// ================== default ==================
map.on('load', async () => {
  try {
    await loadCSVData();
    add3DBuildings();
    addExtrudedBuildings();

    // MODIFIED: default layers
    Object.entries(locations).forEach(([locationKey, location]) => {
      map.addSource(`${locationKey}-source`, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: location.geometry, 
          properties: {}
        }
      });

      map.addLayer({
        id: `${locationKey}-fill`,
        type: 'fill',
        source: `${locationKey}-source`,
        paint: {
          'fill-color': '#ff9a3b',
          'fill-opacity': 0.0,
          'fill-outline-color': '#ff9a3b'
        },
        beforeId: 'water'
      });

      map.on('click', `${locationKey}-fill`, () => flyToLocation(locationKey));
      map.on('mouseenter', `${locationKey}-fill`, () => map.getCanvas().style.cursor = 'pointer');
      map.on('mouseleave', `${locationKey}-fill`, () => map.getCanvas().style.cursor = '');
    });

    setTimeout(() => updateBuildingColors(), 1000);

  } catch (err) {
    console.error("default failed:", err);
    alert(`default failed: ${err.message}`);
  }
});

// ================== colour ==================
function updateBuildingColors() {
  const allFeatureIds = Object.values(locations)
    .flatMap(loc => loc.featureIds)
    .filter(id => id && !isNaN(id));
  allFeatureIds.forEach((id) => {
    map.setFeatureState(
      { source: 'composite', sourceLayer: 'building', id: Number(id) },
      { inPolygon: true }
    );
  });
  
  map.triggerRepaint();
  console.log("🚀 3D building have been updated");
}

//flyToLocation

    // 2D/3D mode change
    let is3DMode = false;
    function toggle3DMode() {
      is3DMode = !is3DMode;
      const button = document.getElementById('modeButton');
      if (is3DMode) {
        button.textContent = '🏙️ 3D Mode';
        map.easeTo({ pitch: 45, bearing: -20, duration: 1000 });
      } else {
        button.textContent = '🌐 2D Mode';
        map.easeTo({ pitch: 0, bearing: 0, duration: 1000 });
      }
    }

    // toNorth
    function resetNorth() {
      map.easeTo({
        bearing: 0,
        duration: 1000
      });
    }

    // Button-triggered flight animation and information display function
    function flyToLocation(locationKey) {
      const target = locations[locationKey];
      if (!target) return;
      const flyConfig = {
        center: target.center,
        zoom: target.zoom,
        duration: 3000,
        essential: true,
        curve: is3DMode ? 1.8 : 1.0,
        pitch: is3DMode ? 45 : 0,
        bearing: is3DMode ? -20 : 0
      };
      map.flyTo(flyConfig);
      const infoPanel = document.querySelector('.info-content');
      infoPanel.innerHTML = target.info ?? 'No information available.';
    }

    const defaultCenter = [-0.039800, 51.515600];
    const defaultZoom = 12.66;
    function resetView() {
      const currentPitch = map.getPitch();
      const currentBearing = map.getBearing();
      map.easeTo({
        center: defaultCenter,
        zoom: defaultZoom,
        pitch: currentPitch,
        bearing: currentBearing,
        duration: 1500,
        essential: true
      });
    }

    function goToIndex() {
      window.location.href = 'index.html'; // Change 'index.html' to the actual index page URL
    }

    const infoPanel = document.getElementById("infoPanel");
    const toggleBtn = document.getElementById("togglePanelBtn");
    const mapContainer = document.getElementById("map");

    // monitor
    toggleBtn.addEventListener("click", () => {
        infoPanel.classList.toggle("hidden");
        
        if (infoPanel.classList.contains("hidden")) {
            document.body.classList.add("panel-hidden");
            toggleBtn.innerHTML = "◀"; 
        } else {
            document.body.classList.remove("panel-hidden");
            toggleBtn.innerHTML = "▶";
        }

        // resize the map
        setTimeout(() => {
            map.resize();
        }, 300);
    });



