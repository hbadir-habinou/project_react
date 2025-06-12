import React, { useState, useEffect } from 'react';
import { FaShoppingCart, FaCheck, FaTruck, FaBox } from 'react-icons/fa';
import { useLanguage } from '../contexts/LanguageContext';

const Cart = ({ items, onOrderSubmit, onDeliveryConfirm }) => {
  const { t } = useLanguage();
  const [categorizedItems, setCategorizedItems] = useState({});
  const [totalAmount, setTotalAmount] = useState(0);
  const [orderStatus, setOrderStatus] = useState('pending'); // pending, accepted, delivered
  const [vendors, setVendors] = useState({});

  useEffect(() => {
    // Catégoriser les articles
    const categories = items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});

    setCategorizedItems(categories);

    // Calculer le total
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setTotalAmount(total);

    // Simuler la récupération des vendeurs (à remplacer par votre logique)
    const mockVendors = {
      'Fruits & Légumes': 'Marché Central',
      'Viandes': 'Boucherie Traditionnelle',
      'Épicerie': 'Super U',
      // Ajoutez d'autres catégories et vendeurs
    };
    setVendors(mockVendors);
  }, [items]);

  const handleSubmitOrder = async () => {
    try {
      // Préparer les commandes par vendeur
      const ordersByVendor = Object.entries(categorizedItems).reduce((acc, [category, items]) => {
        const vendor = vendors[category];
        if (!acc[vendor]) {
          acc[vendor] = [];
        }
        acc[vendor].push(...items);
        return acc;
      }, {});

      // Soumettre les commandes
      await onOrderSubmit(ordersByVendor);
      setOrderStatus('accepted');
    } catch (error) {
      console.error('Erreur lors de la soumission de la commande:', error);
    }
  };

  const handleDeliveryConfirm = async () => {
    try {
      await onDeliveryConfirm();
      setOrderStatus('delivered');
    } catch (error) {
      console.error('Erreur lors de la confirmation de livraison:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          <FaShoppingCart className="inline-block mr-2" />
          Panier
        </h2>
        <div className="text-xl font-semibold text-purple-600">
          Total: {totalAmount.toFixed(2)} €
        </div>
      </div>

      {/* Articles par catégorie */}
      <div className="space-y-6">
        {Object.entries(categorizedItems).map(([category, items]) => (
          <div key={category} className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-700">{category}</h3>
              <span className="text-sm text-gray-500">
                Vendeur: {vendors[category]}
              </span>
            </div>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <span className="text-gray-600">{item.name}</span>
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-500">{item.quantity} x</span>
                    <span className="text-gray-700">{item.price.toFixed(2)} €</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-end space-x-4">
        {orderStatus === 'pending' && (
          <button
            onClick={handleSubmitOrder}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Soumettre la commande
          </button>
        )}
        {orderStatus === 'accepted' && (
          <button
            onClick={handleDeliveryConfirm}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <FaTruck className="mr-2" />
            Confirmer la livraison
          </button>
        )}
        {orderStatus === 'delivered' && (
          <div className="flex items-center text-green-600">
            <FaCheck className="mr-2" />
            Livré
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart; 