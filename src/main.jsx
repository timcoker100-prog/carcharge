import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './styles.css';
import { cars, providers, chargers } from './sampleData.js';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
console.log(import.meta.env.VITE_MAPBOX_TOKEN);
const STORAGE_KEY = 'carcharge-preferences-v1';
const OPERATOR_NAMES = {
  3: 'Tesco',
  23: 'Tesla Supercharger',
  32: 'Shell Recharge',
  103: 'Shell Recharge',
  203: 'Instavolt',
  3392: 'Unknown operator',
  3430: 'Welcome Break',
};

function loadPreferences() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (error) {
    console.warn('Could not load preferences', error);
  }

  return {
  manufacturer: 'Volvo',
  model: 'EX30',
  radiusMiles: 10,
  minimumKw: 50,
  contactlessOnly: false,
  avoidAppRequired: false,
  scheme: 'volvo',
  selectedProviders: [],
  preferredProvidersOnly: false
};
}

function speedClass(maxKw) {
  if (maxKw >= 150) return 'speed-green';
  if (maxKw >= 50) return 'speed-yellow';
  if (maxKw >= 22) return 'speed-orange';
  return 'speed-red';
}

function speedLabel(maxKw) {
  if (maxKw >= 150) return 'Ultra rapid';
  if (maxKw >= 50) return 'Rapid';
  if (maxKw >= 22) return 'Fast';
  return 'Slow';
}

function App() {
  const mapRef = useRef(null);
const markersRef = useRef([]);
  
useEffect(() => {
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v12",
  center: [-1.38, 52.25],
  zoom: 11
});

mapRef.current = map;

  setTimeout(() => {
  map.resize();
}, 300);
  return () => map.remove();
}, []);
  const [preferences, setPreferences] = useState(loadPreferences);
  const [searchPlace, setSearchPlace] = useState('Napton');
  const [searchCoords, setSearchCoords] = useState({ lat: 52.25, lng: -1.38 });
const [providerSearch, setProviderSearch] = useState('');
const [liveChargers, setLiveChargers] = useState([]);
const [loadingChargers, setLoadingChargers] = useState(false);
const [chargerError, setChargerError] = useState('');
const [favourites, setFavourites] = useState(() => {
  try {
    return JSON.parse(localStorage.getItem('carcharge-favourites')) || [];
  } catch {
    return [];
  }
});

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);
  useEffect(() => {
  async function fetchChargers() {
    setLoadingChargers(true);
    setChargerError('');

    try {
      const url =
        `https://api.openchargemap.io/v3/poi/?` +
        `output=json` +
        `&countrycode=GB` +
        `&latitude=${searchCoords.lat}` +
`&longitude=${searchCoords.lng}` +
        `&distance=${preferences.radiusMiles}` +
        `&distanceunit=Miles` +
        `&maxresults=50` +
        `&compact=true` +
        `&verbose=false` +
`&key=b4b368de-1eec-410a-9c62-d1450eb54da6`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Open Charge Map error: ${response.status}`);
      }

      const data = await response.json();
            setLiveChargers(data);
      
 
    } catch (error) {
      setChargerError(error.message);
    } finally {
      setLoadingChargers(false);
    }
  }

  fetchChargers();
}, [preferences.radiusMiles, searchCoords]);

  const availableModels = cars.filter((car) => car.manufacturer === preferences.manufacturer);
  const selectedCar = cars.find(
    (car) => car.manufacturer === preferences.manufacturer && car.model === preferences.model
  ) || availableModels[0];

 const convertedLiveChargers = useMemo(() => {
  return liveChargers.flatMap((point) => {
  const operatorName =
  point.OperatorInfo?.Title ||
  OPERATOR_NAMES[point.OperatorID] ||
  'Unknown provider';
  
    const address = point.AddressInfo?.Title || point.AddressInfo?.AddressLine1 || 'Unknown location';

    
   const connections = point.Connections || [];

const speeds = connections.map(
  (connection) => connection.PowerKW || 0
);

const maxKw = Math.max(...speeds, 0);

const connectorTypes = [
  ...new Set(
    connections.map((connection) =>
      connection.ConnectionType?.Title?.includes('Type 2')
        ? 'Type 2'
        : 'CCS'
    )
  )
];

return [{
  id: point.ID,
  name: point.AddressInfo?.Title || 'Charging location',
  address,
  operatorId: point.OperatorID,
  providerName: operatorName,
  providerId: operatorName.toLowerCase().replaceAll(' ', '-'),
  latitude: point.AddressInfo?.Latitude,
  longitude: point.AddressInfo?.Longitude,
  connectorType: connectorTypes.join(', '),
  connectorTypes,
  maxKw,
  connectionCount: connections.length,
  availabilityStatus: point.StatusType?.Title || 'Status unknown'
}];
  });
}, [liveChargers]);

const filteredChargers = useMemo(() => {
  
    return convertedLiveChargers.filter((charger) => {
   if (preferences.connectorFilter === 'ccs' && !charger.connectorTypes.includes('CCS')) return false;
if (preferences.connectorFilter === 'type2' && !charger.connectorTypes.includes('Type 2')) return false;
    if (charger.maxKw < Number(preferences.minimumKw)) return false;
if (
  preferences.preferredProvidersOnly &&
  !preferences.selectedProviders.includes(charger.providerId)
) return false;
    return true;
  });
}, [convertedLiveChargers, preferences]);
useEffect(() => {
  if (!mapRef.current) return;

  markersRef.current.forEach((marker) => marker.remove());
  markersRef.current = [];

  const bounds = new mapboxgl.LngLatBounds();

  filteredChargers.forEach((charger) => {
    if (!charger.latitude || !charger.longitude) return;

    const marker = new mapboxgl.Marker()
      .setLngLat([charger.longitude, charger.latitude])
      .setPopup(
        new mapboxgl.Popup().setHTML(
          `<strong>${charger.name}</strong><br>${charger.providerName}<br>${charger.maxKw || '?'} kW`
        )
      )
      .addTo(mapRef.current);
      marker.getElement().addEventListener('click', () => {
        const card = document.getElementById(`charger-${charger.id}`);
        if (card) {
    card.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });

    card.classList.add('highlight-card');

    setTimeout(() => {
      card.classList.remove('highlight-card');
    }, 2000);
  }
});
     

    markersRef.current.push(marker);
    bounds.extend([charger.longitude, charger.latitude]);
  });

  if (markersRef.current.length > 0) {
    mapRef.current.fitBounds(bounds, {
      padding: 60,
      maxZoom: 13
    });
  }
}, [filteredChargers]);
  function updatePreference(name, value) {
    setPreferences((current) => ({ ...current, [name]: value }));
  }

  function toggleProvider(providerId) {
    setPreferences((current) => {
      const selected = current.selectedProviders.includes(providerId)
        ? current.selectedProviders.filter((id) => id !== providerId)
        : [...current.selectedProviders, providerId];
      return { ...current, selectedProviders: selected };
    });
  }
function toggleFavourite(chargerId) {
  setFavourites((current) => {
    const next = current.includes(chargerId)
      ? current.filter((id) => id !== chargerId)
      : [...current, chargerId];

    localStorage.setItem(
      'carcharge-favourites',
      JSON.stringify(next)
    );

    return next;
  });
}
  async function searchLocation() {
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchPlace)}.json?` +
    `country=gb&access_token=${mapboxgl.accessToken}`;

  const response = await fetch(url);
  const data = await response.json();

  const firstResult = data.features?.[0];
  if (!firstResult) return;

  const [lng, lat] = firstResult.center;

  setSearchCoords({ lat, lng });

  if (mapRef.current) {
    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: 11
    });
  }
}
  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">CarCharge</p>
          <h1>Find chargers that suit your car.</h1>
          <p>
            Search an area, apply your saved car and provider preferences, and see compatible EV chargers.
          </p>
        </div>
      </header>

      <section className="layout">
        <aside className="panel">
          <h2>Search</h2>
          <label>
            Place or postcode
            <input value={searchPlace} onChange={(event) => setSearchPlace(event.target.value)} />
          <button type="button" onClick={searchLocation}>
  Search this area
</button>
          </label>
          <label>
            Radius
            <select
              value={preferences.radiusMiles}
              onChange={(event) => updatePreference('radiusMiles', Number(event.target.value))}
            >
              {[5, 10, 25, 50].map((radius) => (
                <option key={radius} value={radius}>{radius} miles</option>
              ))}
            </select>
          </label>

          <h2>My car</h2>

<div className="car-summary">
  <strong>Volvo EX30</strong>
  <p>Type 2 AC · CCS DC · AC 11 kW · DC 153 kW</p>
</div>

<label>
  Charging plugs to include
  <select
    value={preferences.connectorFilter || 'both'}
    onChange={(event) => updatePreference('connectorFilter', event.target.value)}
  >
    <option value="both">Type 2 AC and CCS DC</option>
    <option value="ccs">CCS DC only</option>
    <option value="type2">Type 2 AC only</option>
  </select>
</label>
          <h2>Filters</h2>
          <label>
            Minimum charger speed
            <select
              value={preferences.minimumKw}
              onChange={(event) => updatePreference('minimumKw', Number(event.target.value))}
            >
              {[7, 22, 50, 100, 150].map((speed) => (
                <option key={speed} value={speed}>{speed} kW+</option>
              ))}
            </select>
          </label>
          <label>
            Charging scheme
            <select
              value={preferences.scheme}
              onChange={(event) => updatePreference('scheme', event.target.value)}
            >
              <option value="any">All chargers</option>
<option value="volvo">Volvo voucher compatible</option>
            </select>
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={preferences.contactlessOnly}
              onChange={(event) => updatePreference('contactlessOnly', event.target.checked)}
            />
            Contactless only
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={preferences.avoidAppRequired}
              onChange={(event) => updatePreference('avoidAppRequired', event.target.checked)}
            />
            Avoid app-required providers
          </label>


<label className="checkbox-row">
  <input
    type="checkbox"
    checked={preferences.preferredProvidersOnly}
    onChange={(event) =>
      updatePreference(
        'preferredProvidersOnly',
        event.target.checked
      )
    }
  />
  Show only my preferred providers
</label>

<h2>Providers</h2>
   <p className="helper-text">
  Save networks you trust. Tick “Show only my preferred providers” to filter to them.
</p>

<label>
  Search providers
  <input
    value={providerSearch}
    onChange={(event) => setProviderSearch(event.target.value)}
    placeholder="Type provider name"
  />
</label>

<div className="provider-actions">
  <button onClick={() => updatePreference('selectedProviders', providers.map((p) => p.id))}>
    Select all shown
  </button>
  <button onClick={() => updatePreference('selectedProviders', [])}>
    Clear all
  </button>
</div>

<div className="provider-list">
  {providers
    .filter((provider) =>
      provider.name.toLowerCase().includes(providerSearch.toLowerCase())
    )
    .map((provider) => (
      <label key={provider.id} className="checkbox-row">
        <input
          type="checkbox"
          checked={preferences.selectedProviders.includes(provider.id)}
          onChange={() => toggleProvider(provider.id)}
        />
        {provider.name}
      </label>
    ))}
</div>

<div className="selected-providers">
  <strong>Selected providers:</strong>
  <p>
  {[
    ...new Set([
      ...providers
        .filter((provider) =>
          preferences.selectedProviders.includes(provider.id)
        )
        .map((provider) => provider.name),

      ...liveChargers
        .filter((charger) =>
          preferences.selectedProviders.includes(charger.providerId)
        )
        .map((charger) => charger.providerName)
    ])
  ].join(', ') || 'None selected'}
</p>
</div>
</aside>

        <section className="results-area">
<div className="map-placeholder">
  <h2>Map view</h2>

  <div
  id="map"
  style={{
    width: "900px",
    maxWidth: "100%",
    height: "650px",
    borderRadius: "12px",
    overflow: "hidden"
  }}
/>
</div>

          <div className="results-header">
            <h2>{filteredChargers.length} matching chargers near {searchPlace}</h2>
            <p>Your choices are saved automatically on this device.</p>
          </div>

          <div className="charger-grid">
            {filteredChargers.map((charger) => {
           return (
  <article
  id={`charger-${charger.id}`}
  key={charger.id}
  className="charger-card"
  onClick={() => {
    if (mapRef.current && charger.latitude && charger.longitude) {
      mapRef.current.flyTo({
        center: [charger.longitude, charger.latitude],
        zoom: 15
      });
    }
  }}
>
    <div className="charger-title-row">
      <div>
        <h3>{charger.name}</h3>
        <p>{charger.providerName} · {charger.address}</p>
              </div>
      <span className={`speed-badge ${speedClass(charger.maxKw)}`}>
        {charger.maxKw || '?'} kW
      </span>
    </div>

    <div className="tags">
      <span>{speedLabel(charger.maxKw)}</span>
      <span>{charger.connectorType}</span>
      <span>{charger.availabilityStatus}</span>
      <span>
  {charger.connectionCount} connector{charger.connectionCount === 1 ? '' : 's'}
</span>
    </div>
    <a
  className="maps-link"
  href={`https://www.google.com/maps/search/?api=1&query=${charger.latitude},${charger.longitude}`}
  target="_blank"
  rel="noreferrer"
>
  🧭 Navigate
</a>
<a
  className="zapmap-link"
  href={`https://www.zap-map.com/live/?search=${encodeURIComponent(`${charger.name} ${charger.address} ${searchPlace}`)}`}
  target="_blank"
  rel="noreferrer"
>
  📱 Zapmap
</a>
<button
  type="button"
  className="favourite-button"
  onClick={(event) => {
    event.stopPropagation();
    toggleFavourite(charger.id);
  }}
>
  {favourites.includes(charger.id) ? '⭐ Favourite charger' : '☆ Favourite this charger'}
</button>
<button
  type="button"
  className="provider-save-button"
  onClick={(event) => {
    event.stopPropagation();

    const alreadySaved = preferences.selectedProviders.includes(charger.providerId);

    updatePreference(
      'selectedProviders',
      alreadySaved
        ? preferences.selectedProviders.filter((id) => id !== charger.providerId)
        : [...preferences.selectedProviders, charger.providerId]
    );
  }}
>
  {preferences.selectedProviders.includes(charger.providerId)
    ? `✓ Preferred network`
    : `🏢 Prefer ${charger.providerName}`}
</button>
  </article>
);
                                     
              ;
            })}
          </div>
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
