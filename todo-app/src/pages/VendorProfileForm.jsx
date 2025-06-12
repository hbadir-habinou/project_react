import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { useLanguage } from '../contexts/LanguageContext'
import { motion } from 'framer-motion'
import { HiOutlineUser, HiOutlineCalendar, HiOutlineLocationMarker, HiOutlinePhotograph } from 'react-icons/hi'
import { toast } from 'react-hot-toast'

const INGREDIENT_CATEGORIES = [
  { id: 'fruits', label: 'Fruits' },
  { id: 'vegetables', label: 'Légumes' },
  { id: 'meat', label: 'Viandes' },
  { id: 'fish', label: 'Poissons' },
  { id: 'dairy', label: 'Produits laitiers' },
  { id: 'bakery', label: 'Boulangerie' },
  { id: 'pasta', label: 'Pâtes et céréales' },
  { id: 'spices', label: 'Épices et condiments' },
  { id: 'beverages', label: 'Boissons' },
  { id: 'snacks', label: 'Snacks et grignotages' },
  { id: 'frozen', label: 'Surgelés' },
  { id: 'canned', label: 'Conserves' }
]

const VendorProfileForm = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    fullName: '',
    birthDate: '',
    gender: '',
    profilePic: null,
    categories: [],
    location: null
  })

  useEffect(() => {
    // Récupérer la position de l'utilisateur
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
          }))
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error)
          toast.error('Impossible de récupérer votre position')
        }
      )
    }
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCategoryChange = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          profilePic: reader.result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const user = auth.currentUser
      if (!user) {
        throw new Error('Utilisateur non connecté')
      }

      if (!formData.location) {
        throw new Error('Position non disponible')
      }

      const vendorData = {
        ...formData,
        email: user.email,
        role: 'vendor',
        completedProfile: true,
        createdAt: new Date(),
        status: 'active'
      }

      await setDoc(doc(db, 'users', user.uid), vendorData, { merge: true })
      toast.success('Profil vendeur créé avec succès')
      navigate('/vendor-dashboard')
    } catch (err) {
      setError(err.message)
      toast.error('Erreur lors de la création du profil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-8 py-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800">Configuration du profil vendeur</h2>
              <p className="text-gray-600 mt-2">Complétez vos informations pour commencer</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <HiOutlineUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="fullName"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Nom complet"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="relative">
                  <HiOutlineCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    name="birthDate"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="relative">
                  <select
                    name="gender"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.gender}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Sélectionnez votre genre</option>
                    <option value="male">Homme</option>
                    <option value="female">Femme</option>
                    <option value="other">Autre</option>
                  </select>
                </div>

                <div className="relative">
                  <HiOutlinePhotograph className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    onChange={handleImageChange}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Catégories d'ingrédients proposées</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {INGREDIENT_CATEGORIES.map(category => (
                    <label key={category.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.categories.includes(category.id)}
                        onChange={() => handleCategoryChange(category.id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{category.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-600">
                  <HiOutlineLocationMarker className="mr-2" />
                  {formData.location ? (
                    <span>Position enregistrée</span>
                  ) : (
                    <span>En attente de la position...</span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !formData.location}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer et continuer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default VendorProfileForm 