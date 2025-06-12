import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { FaStore, FaShoppingCart, FaMapMarkerAlt } from 'react-icons/fa';
import { useLanguage } from '../contexts/LanguageContext';
import { storeIcons } from '../utils/leafletIcons';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Correction des icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const NearbyStores = ({ onStoreSelect, selectedStores }) => {
  const { t } = useLanguage();
  const [userLocation, setUserLocation] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showList, setShowList] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          fetchNearbyStores(latitude, longitude);
        },
        (error) => {
          setError('Erreur lors de la récupération de votre position');
          setLoading(false);
        }
      );
    } else {
      setError('La géolocalisation n\'est pas supportée par votre navigateur');
      setLoading(false);
    }
  };

  const fetchNearbyStores = async (latitude, longitude) => {
    try {
      // Utilisation de l'API Overpass pour OpenStreetMap
      const radius = 10000; // 10km en mètres
      const query = `
        [out:json][timeout:25];
        (
          node["shop"="supermarket"](around:${radius},${latitude},${longitude});
          node["shop"="market"](around:${radius},${latitude},${longitude});
          node["amenity"="marketplace"](around:${radius},${latitude},${longitude});
        );
        out body;
        >;
        out skel qt;
      `;

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query
      });

      const data = await response.json();
      const processedStores = data.elements.map(store => ({
        id: store.id,
        name: store.tags.name || 'Magasin sans nom',
        type: store.tags.shop || 'market',
        position: [store.lat, store.lon],
        address: store.tags['addr:street'] || '',
        categories: getStoreCategories(store.tags)
      }));

      setStores(processedStores);
      setLoading(false);
    } catch (error) {
      setError('Erreur lors de la récupération des magasins');
      setLoading(false);
    }
  };

  const getStoreCategories = (tags) => {
    const categories = [];
    if (tags.shop === 'supermarket') categories.push('Épicerie');
    if (tags.shop === 'market') categories.push('Marché');
    if (tags.amenity === 'marketplace') categories.push('Marché');
    return categories;
  };

  const handleStoreSelect = (store) => {
    setSelectedStore(store);
    onStoreSelect(store);
  };

  const RecenterAutomatically = () => {
    const map = useMap();
    useEffect(() => {
      if (userLocation) {
        map.setView(userLocation, 13);
      }
    }, [userLocation, map]);
    return null;
  };

  if (loading) {
    return <div className="text-center p-4">Chargement de la carte...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          <FaMapMarkerAlt className="inline-block mr-2" />
          Magasins à proximité
        </h2>
        <button
          onClick={() => setShowList(!showList)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          {showList ? 'Voir la carte' : 'Voir la liste'}
        </button>
      </div>

      {showList ? (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {stores.map((store) => (
            <div
              key={store.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedStores?.includes(store.id)
                  ? 'bg-purple-100 border-purple-500'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleStoreSelect(store)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">{store.name}</h3>
                  <p className="text-sm text-gray-600">{store.address}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {store.categories.map((category, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
                <FaStore className="text-purple-500 text-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-96 rounded-lg overflow-hidden">
          {userLocation && (
            <MapContainer
              center={userLocation}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              ref={mapRef}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <RecenterAutomatically />
              
              {/* Marqueur de la position de l'utilisateur */}
              <Marker
                position={userLocation}
                icon={L.divIcon({
                  className: 'custom-div-icon',
                  html: `<div style="background-color: #4F46E5; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
                  iconSize: [12, 12],
                  iconAnchor: [6, 6]
                })}
              >
                <Popup>Votre position</Popup>
              </Marker>

              {/* Marqueurs des magasins */}
              {stores.map((store) => (
                <Marker
                  key={store.id}
                  position={store.position}
                  icon={storeIcons[store.type] || storeIcons.default}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-semibold">{store.name}</h3>
                      <p className="text-sm text-gray-600">{store.address}</p>
                      <div className="mt-2">
                        <button
                          onClick={() => handleStoreSelect(store)}
                          className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors"
                        >
                          Sélectionner
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>
      )}

      {/* Légende */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Légende</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-sm">Supermarchés</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm">Marchés</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
            <span className="text-sm">Autres magasins</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-indigo-500 rounded-full mr-2"></div>
            <span className="text-sm">Votre position</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NearbyStores; 