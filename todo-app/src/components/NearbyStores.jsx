import React, { useState, useCallback, useEffect } from "react"
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api"
import { db, auth } from "../firebase"
import { collection, onSnapshot } from "firebase/firestore"

const containerStyle = {
  width: "100%",
  height: "600px",
}

const GOOGLE_MAPS_API_KEY = "AIzaSyDqJtH6hpF1i1ct9qHzKsqHh4wzMwZTzfw"

// Définir les bibliothèques comme une constante statique
const libraries = ["places"]

const storeTypes = {
  supermarket: {
    icon: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    label: "Supermarché",
  },
  grocery_or_supermarket: {
    icon: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
    label: "Épicerie",
  },
  shopping_mall: {
    icon: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
    label: "Centre commercial",
  },
}

function NearbyStores() {
  const [center, setCenter] = useState({ lat: 0, lng: 0 })
  const [map, setMap] = useState(null)
  const [stores, setStores] = useState([])
  const [selectedStore, setSelectedStore] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [shoppingList, setShoppingList] = useState([])
  const [placesService, setPlacesService] = useState(null)

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  })

  useEffect(() => {
    const user = auth.currentUser
    if (!user) return

    const shoppingListRef = collection(db, "users", user.uid, "shoppingList")
    const unsubscribe = onSnapshot(shoppingListRef, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setShoppingList(items)
    })

    return () => unsubscribe()
  }, [])

  const searchNearbyStores = useCallback(async (location) => {
    if (!map || !window.google || !placesService) {
      console.error("La carte ou le service Places n'est pas initialisé")
      return
    }

    setStores([]) // Réinitialiser la liste des magasins

    const searchTypes = ["supermarket", "grocery_or_supermarket", "shopping_mall"]
    
    try {
      const searchPromises = searchTypes.map(type => {
        return new Promise((resolve, reject) => {
          const request = {
            location: new window.google.maps.LatLng(location.lat, location.lng),
            radius: 10000, // 10km
            type: type
          }

          placesService.nearbySearch(request, (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
              resolve(results.map(place => ({
                ...place,
                type: type,
                distance: calculateDistance(location, place.geometry.location)
              })))
            } else {
              console.warn(`Aucun résultat pour ${type}:`, status)
              resolve([])
            }
          })
        })
      })

      const results = await Promise.all(searchPromises)
      const allStores = results.flat()
      
      if (allStores.length > 0) {
        setStores(allStores)
        
        // Ajuster les limites de la carte pour montrer tous les magasins
        const bounds = new window.google.maps.LatLngBounds()
        bounds.extend(location)
        allStores.forEach(store => {
          bounds.extend(store.geometry.location)
        })
        map.fitBounds(bounds)
      } else {
        console.log("Aucun magasin trouvé dans un rayon de 10km")
      }
    } catch (error) {
      console.error("Erreur lors de la recherche des magasins:", error)
      alert("Une erreur est survenue lors de la recherche des magasins à proximité.")
    }
  }, [map, placesService])

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par votre navigateur")
      return
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setCenter(pos)
        setUserLocation(pos)
        if (map && placesService) {
          searchNearbyStores(pos)
        }
      },
      (error) => {
        console.error("Erreur de géolocalisation:", error)
        alert("Erreur lors de la récupération de votre position. Veuillez vérifier vos paramètres de localisation.")
      },
      options
    )
  }, [map, placesService, searchNearbyStores])

  const calculateDistance = (pos1, pos2) => {
    const R = 6371 // Rayon de la Terre en km
    const lat1 = pos1.lat
    const lon1 = pos1.lng
    const lat2 = pos2.lat()
    const lon2 = pos2.lng()
    
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const d = R * c
    
    return Math.round(d * 10) / 10
  }

  const toRad = (value) => {
    return value * Math.PI / 180
  }

  const onLoad = useCallback((map) => {
    setMap(map)
    setPlacesService(new window.google.maps.places.PlacesService(map))
  }, [])

  const onUnmount = useCallback(() => {
    setMap(null)
    setPlacesService(null)
  }, [])

  // Initialiser la géolocalisation après le chargement de la carte
  useEffect(() => {
    if (map && placesService) {
      getCurrentPosition()
    }
  }, [map, placesService, getCurrentPosition])

  if (!isLoaded) {
    return (
      <div className="p-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement de la carte...</span>
        </div>
        <p className="mt-2">Chargement de la carte...</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold mb-4">
            <i className="fas fa-store me-2"></i>
            Magasins à proximité
          </h2>
          <div className="flex gap-4 mb-4">
            {Object.entries(storeTypes).map(([key, { icon, label }]) => (
              <div key={key} className="flex items-center">
                <img src={icon} alt={label} className="w-6 h-6 mr-2" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-lg max-w-md">
          <h3 className="text-lg font-semibold mb-2">
            <i className="fas fa-shopping-basket me-2"></i>
            Liste de courses
          </h3>
          {shoppingList && shoppingList.length > 0 ? (
            <ul className="list-disc pl-5">
              {shoppingList.map((item) => (
                <li key={item.id} className="mb-1">
                  {item.name} ({item.quantity} {item.unit})
                  {item.purchased && (
                    <span className="text-green-500 ml-2">
                      <i className="fas fa-check"></i>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Aucun article dans la liste de courses</p>
          )}
        </div>
      </div>

      <div className="relative">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={12}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            zoomControl: true,
            mapTypeControl: true,
            scaleControl: true,
            streetViewControl: true,
            rotateControl: true,
            fullscreenControl: true
          }}
        >
          {userLocation && (
            <Marker
              position={userLocation}
              icon={{
                url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                scaledSize: new window.google.maps.Size(40, 40),
              }}
              title="Votre position"
            />
          )}

          {stores.map((store, index) => (
            <Marker
              key={index}
              position={{
                lat: store.geometry.location.lat(),
                lng: store.geometry.location.lng(),
              }}
              icon={{
                url: storeTypes[store.type]?.icon || storeTypes.supermarket.icon,
                scaledSize: new window.google.maps.Size(30, 30),
              }}
              onClick={() => setSelectedStore(store)}
            />
          ))}

          {selectedStore && (
            <InfoWindow
              position={{
                lat: selectedStore.geometry.location.lat(),
                lng: selectedStore.geometry.location.lng(),
              }}
              onCloseClick={() => setSelectedStore(null)}
            >
              <div>
                <h3 className="font-bold">{selectedStore.name}</h3>
                <p className="text-sm">
                  {selectedStore.vicinity}
                  <br />
                  Distance: {selectedStore.distance} km
                </p>
                {selectedStore.rating && (
                  <p className="text-sm">
                    Note: {selectedStore.rating} ⭐ ({selectedStore.user_ratings_total} avis)
                  </p>
                )}
                {userLocation && (
                  <button
                    className="btn btn-sm btn-primary mt-2"
                    onClick={() => {
                      const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${selectedStore.geometry.location.lat()},${selectedStore.geometry.location.lng()}&travelmode=driving`
                      window.open(url, "_blank")
                    }}
                  >
                    <i className="fas fa-directions me-1"></i>
                    Itinéraire
                  </button>
                )}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        <div className="absolute bottom-4 right-4 flex gap-2">
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg"
            onClick={getCurrentPosition}
          >
            <i className="fas fa-location-arrow me-2"></i>
            Ma position
          </button>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-xl font-bold mb-2">
          Magasins trouvés ({stores.length})
          {stores.length > 0 && (
            <span className="text-sm text-gray-500 ml-2">(Cliquez pour voir les détails)</span>
          )}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((store, index) => (
            <div
              key={index}
              className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedStore(store)
                map.panTo({
                  lat: store.geometry.location.lat(),
                  lng: store.geometry.location.lng(),
                })
              }}
            >
              <div className="flex items-start">
                <img
                  src={storeTypes[store.type]?.icon || storeTypes.supermarket.icon}
                  alt={store.name}
                  className="w-6 h-6 mr-2"
                />
                <div>
                  <h4 className="font-bold">{store.name}</h4>
                  <p className="text-sm text-gray-600">{store.vicinity}</p>
                  <p className="text-sm">Distance: {store.distance} km</p>
                  {store.rating && (
                    <p className="text-sm">
                      Note: {store.rating} ⭐ ({store.user_ratings_total} avis)
                    </p>
                  )}
                  {userLocation && (
                    <button
                      className="btn btn-sm btn-outline-primary mt-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${store.geometry.location.lat()},${store.geometry.location.lng()}&travelmode=driving`
                        window.open(url, "_blank")
                      }}
                    >
                      <i className="fas fa-directions me-1"></i>
                      Itinéraire
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default React.memo(NearbyStores) 