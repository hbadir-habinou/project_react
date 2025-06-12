"use client"

import React, { useState, useMemo } from 'react';
import { FaUsers, FaUtensils, FaShoppingCart, FaCalendarAlt, FaChartLine } from 'react-icons/fa';
import { MdRestaurantMenu } from 'react-icons/md';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { format, subDays, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  ChartBarIcon, 
  CalendarIcon, 
  ArrowTrendingUpIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { useLanguage } from "../contexts/LanguageContext";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const DashboardOverview = ({ 
  familyMembers, 
  dishes, 
  shoppingList, 
  mealPlan,
  privateDishes,
  notifications 
}) => {
  const { t } = useLanguage();
  const [timeRange, setTimeRange] = useState('week'); // 'day', 'week', 'month'
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'trends', 'notifications'

  // Calcul des statistiques de base
  const stats = useMemo(() => ({
    totalMembers: familyMembers?.length || 0,
    totalDishes: dishes?.length || 0,
    privateDishes: privateDishes?.length || 0,
    shoppingItems: shoppingList?.length || 0,
    plannedMeals: mealPlan?.filter(meal => meal !== null).length || 0,
    notifications: notifications?.length || 0
  }), [familyMembers, dishes, privateDishes, shoppingList, mealPlan, notifications]);

  // Données pour le graphique des plats par catégorie
  const categoryData = useMemo(() => {
    const categories = dishes?.reduce((acc, dish) => {
      const category = dish.category || 'Non catégorisé';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(categories || {}).map(([name, value]) => ({
      name,
      value
    }));
  }, [dishes]);

  // Données pour le graphique d'activité
  const activityData = useMemo(() => {
    const today = new Date();
    const ranges = {
      day: subDays(today, 1),
      week: subDays(today, 7),
      month: subDays(today, 30)
    };

    return dishes?.reduce((acc, dish) => {
      const date = new Date(dish.createdAt);
      if (isWithinInterval(date, { start: ranges[timeRange], end: today })) {
        const day = format(date, 'dd/MM', { locale: fr });
        acc[day] = (acc[day] || 0) + 1;
      }
      return acc;
    }, {}) || {};
  }, [dishes, timeRange]);

  const cards = [
    {
      title: "Membres de la Famille",
      value: stats.totalMembers,
      icon: <FaUsers className="h-8 w-8" />,
      color: "bg-blue-500",
      description: "Personnes configurées",
      trend: "+2 ce mois"
    },
    {
      title: "Plats Totaux",
      value: stats.totalDishes,
      icon: <FaUtensils className="h-8 w-8" />,
      color: "bg-green-500",
      description: "Recettes enregistrées",
      trend: "+5 cette semaine"
    },
    {
      title: "Plats Privés",
      value: stats.privateDishes,
      icon: <MdRestaurantMenu className="h-8 w-8" />,
      color: "bg-purple-500",
      description: "Recettes personnelles",
      trend: "+3 ce mois"
    },
    {
      title: "Courses à Faire",
      value: stats.shoppingItems,
      icon: <FaShoppingCart className="h-8 w-8" />,
      color: "bg-yellow-500",
      description: "Articles à acheter",
      trend: "8 en attente"
    },
    {
      title: "Repas Planifiés",
      value: stats.plannedMeals,
      icon: <FaCalendarAlt className="h-8 w-8" />,
      color: "bg-red-500",
      description: "Repas programmés",
      trend: "Cette semaine"
    }
  ];

  return (
    <div className="mb-8">
      {/* En-tête avec onglets */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Vue d'ensemble</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              activeTab === 'overview'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <ChartBarIcon className="h-5 w-5" />
            <span>Vue d'ensemble</span>
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              activeTab === 'trends'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <ArrowTrendingUpIcon className="h-5 w-5" />
            <span>Tendances</span>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              activeTab === 'notifications'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <BellIcon className="h-5 w-5" />
            <span>Notifications</span>
          </button>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
        {cards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105"
          >
            <div className={`${card.color} p-4`}>
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <p className="text-sm font-medium opacity-75">{card.title}</p>
                  <p className="text-3xl font-bold">{card.value}</p>
                </div>
                <div className="text-white opacity-75">
                  {card.icon}
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <p className="text-sm text-gray-600">{card.description}</p>
              <p className="text-xs text-purple-600 mt-1">{card.trend}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Graphiques et visualisations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution des plats par catégorie */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Distribution des Plats</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activité récente */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Activité Récente</h3>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border rounded-md px-3 py-1 text-sm"
            >
              <option value="day">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Object.entries(activityData).map(([date, count]) => ({
                date,
                count
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Notifications récentes */}
      {activeTab === 'notifications' && (
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Notifications Récentes</h3>
          <div className="space-y-4">
            {notifications?.slice(0, 5).map((notification, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <BellIcon className="h-6 w-6 text-purple-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                  <p className="text-sm text-gray-500">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {format(new Date(notification.timestamp), 'PPp', { locale: fr })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardOverview;