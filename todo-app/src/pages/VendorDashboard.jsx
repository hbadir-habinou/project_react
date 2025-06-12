import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { FaShoppingCart, FaList, FaCheck, FaTimes, FaStore } from 'react-icons/fa';
import { MdLocationOn, MdAttachMoney } from 'react-icons/md';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { HiOutlineShoppingCart, HiOutlineClipboardList, HiOutlineLocationMarker } from 'react-icons/hi';
import { toast } from 'react-hot-toast';

const VendorDashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('submissions');
  const [submissions, setSubmissions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vendorData, setVendorData] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/login');
      return;
    }

    // Récupérer les données du vendeur
    const fetchVendorData = async () => {
      try {
        const vendorDoc = await getDoc(doc(db, 'users', user.uid));
        if (vendorDoc.exists()) {
          setVendorData(vendorDoc.data());
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des données du vendeur:', error);
      }
    };

    fetchVendorData();

    // Écouter les soumissions de commandes
    const submissionsQuery = query(
      collection(db, 'orders'),
      where('status', '==', 'pending'),
      where('vendorCategories', 'array-contains-any', vendorData?.categories || [])
    );

    const unsubscribeSubmissions = onSnapshot(submissionsQuery, (snapshot) => {
      const submissionsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSubmissions(submissionsList);
      setLoading(false);
    });

    // Écouter les commandes acceptées
    const ordersQuery = query(
      collection(db, 'orders'),
      where('vendorId', '==', user.uid),
      where('status', 'in', ['accepted', 'delivered'])
    );

    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const ordersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersList);
    });

    return () => {
      unsubscribeSubmissions();
      unsubscribeOrders();
    };
  }, [navigate, vendorData?.categories]);

  const handleAcceptOrder = async (submission, selectedItems, deliveryPrice) => {
    try {
      setLoading(true);
      const orderRef = doc(db, 'orders', submission.id);
      
      await updateDoc(orderRef, {
        status: 'accepted',
        vendorId: auth.currentUser.uid,
        acceptedItems: selectedItems,
        deliveryPrice,
        acceptedAt: new Date()
      });

      toast.success('Commande acceptée avec succès');
      setSelectedSubmission(null);
    } catch (error) {
      console.error('Erreur lors de l\'acceptation de la commande:', error);
      toast.error('Erreur lors de l\'acceptation de la commande');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      setLoading(true);
      const orderRef = doc(db, 'orders', orderId);
      
      await updateDoc(orderRef, {
        status: 'cancelled',
        cancelledAt: new Date()
      });

      toast.success('Commande annulée avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'annulation de la commande:', error);
      toast.error('Erreur lors de l\'annulation de la commande');
    } finally {
      setLoading(false);
    }
  };

  const renderSubmissionsList = () => (
    <div className="space-y-4">
      {submissions.map(submission => (
        <motion.div
          key={submission.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setSelectedSubmission(submission)}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Commande de {submission.customerName}
              </h3>
              <p className="text-sm text-gray-600">
                {submission.items.length} articles
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                {new Date(submission.createdAt.toDate()).toLocaleDateString()}
              </p>
              <span className="inline-block px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full">
                En attente
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderOrdersList = () => (
    <div className="space-y-4">
      {orders.map(order => (
        <motion.div
          key={order.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Commande de {order.customerName}
              </h3>
              <p className="text-sm text-gray-600">
                {order.acceptedItems.length} articles
              </p>
              <p className="text-sm text-gray-600">
                Prix de livraison: {order.deliveryPrice}€
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                {new Date(order.acceptedAt.toDate()).toLocaleDateString()}
              </p>
              <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                order.status === 'accepted' 
                  ? 'text-green-600 bg-green-100'
                  : 'text-blue-600 bg-blue-100'
              }`}>
                {order.status === 'accepted' ? 'Acceptée' : 'Livrée'}
              </span>
              {order.status === 'accepted' && (
                <button
                  onClick={() => handleCancelOrder(order.id)}
                  className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Annuler
                </button>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderSubmissionDetails = () => {
    if (!selectedSubmission) return null;

    const [selectedItems, setSelectedItems] = useState([]);
    const [deliveryPrice, setDeliveryPrice] = useState('');

    const handleItemSelect = (item) => {
      setSelectedItems(prev => 
        prev.includes(item)
          ? prev.filter(i => i !== item)
          : [...prev, item]
      );
    };

    const handleSubmit = () => {
      if (selectedItems.length === 0) {
        toast.error('Veuillez sélectionner au moins un article');
        return;
      }
      if (!deliveryPrice || isNaN(deliveryPrice) || deliveryPrice <= 0) {
        toast.error('Veuillez entrer un prix de livraison valide');
        return;
      }
      handleAcceptOrder(selectedSubmission, selectedItems, parseFloat(deliveryPrice));
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Détails de la commande
              </h2>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Client</p>
                  <p className="font-medium">{selectedSubmission.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">
                    {new Date(selectedSubmission.createdAt.toDate()).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Articles disponibles</h3>
                <div className="space-y-2">
                  {selectedSubmission.items.map(item => (
                    <label
                      key={item.id}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item)}
                        onChange={() => handleItemSelect(item)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">
                          Quantité: {item.quantity}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Prix de livraison (€)
                </label>
                <input
                  type="number"
                  value={deliveryPrice}
                  onChange={(e) => setDeliveryPrice(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Traitement...' : 'Accepter la commande'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Tableau de bord vendeur
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Gérez vos commandes et soumissions
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-600">
              <HiOutlineLocationMarker className="mr-2" />
              <span>
                {vendorData?.location
                  ? `Position: ${vendorData.location.latitude.toFixed(4)}, ${vendorData.location.longitude.toFixed(4)}`
                  : 'Position non disponible'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('submissions')}
                className={`flex items-center px-4 py-2 text-sm font-medium ${
                  activeTab === 'submissions'
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <HiOutlineClipboardList className="mr-2" />
                Liste des soumissions
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center px-4 py-2 text-sm font-medium ${
                  activeTab === 'orders'
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <HiOutlineShoppingCart className="mr-2" />
                Mes commandes
              </button>
            </nav>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <>
                {activeTab === 'submissions' ? renderSubmissionsList() : renderOrdersList()}
                {selectedSubmission && renderSubmissionDetails()}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard; 