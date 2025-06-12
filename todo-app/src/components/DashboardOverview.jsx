"use client"

import { useLanguage } from "../contexts/LanguageContext";

const DashboardOverview = ({ familyMembers, dishes, ingredients, shoppingList, notifications, mealPlan, orders }) => {
  const { t } = useLanguage();

  const stats = [
    {
      title: t("members"),
      value: familyMembers.length + 1,
      icon: "fas fa-users",
      color: "primary",
    },
    {
      title: t("dishes"),
      value: dishes.length,
      icon: "fas fa-utensils",
      color: "success",
    },
    {
      title: t("ingredients"),
      value: ingredients.length,
      icon: "fas fa-carrot",
      color: "warning",
    },
    {
      title: t("shoppingList"),
      value: shoppingList.length,
      icon: "fas fa-shopping-cart",
      color: "info",
    },
    {
      title: t("orders"),
      value: orders.length,
      icon: "fas fa-truck",
      color: "danger",
    },
  ];

  const plannedMeals = Object.values(mealPlan).filter((meal) => meal).length;

  return (
    <div className="dashboard-overview">
      <div className="overview-header">
        <h2 className="overview-title">
          <i className="fas fa-chart-pie me-2"></i>
          {t("sidebar.overview")}
        </h2>
        <p className="overview-subtitle">Aperçu de votre planification familiale</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className={`stat-card stat-${stat.color}`}>
            <div className="stat-icon">
              <i className={stat.icon}></i>
            </div>
            <div className="stat-content">
              <h3 className="stat-value">{stat.value}</h3>
              <p className="stat-title">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="overview-cards">
        <div className="overview-card">
          <div className="card-header">
            <h4>
              <i className="fas fa-calendar-week me-2"></i>
              Plan de la semaine
            </h4>
          </div>
          <div className="card-body">
            <div className="progress-item">
              <span>Repas planifiés</span>
              <div className="progress">
                <div className="progress-bar bg-success" style={{ width: `${(plannedMeals / 7) * 100}%` }}></div>
              </div>
              <span>{plannedMeals}/7</span>
            </div>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-header">
            <h4>
              <i className="fas fa-bell me-2"></i>
              Notifications
            </h4>
          </div>
          <div className="card-body">
            {notifications.length > 0 ? (
              <div className="notification-preview">
                <p className="notification-count">
                  {notifications.length} notification{notifications.length > 1 ? "s" : ""}
                </p>
                <div className="notification-item">
                  <i className="fas fa-exclamation-triangle text-warning me-2"></i>
                  {notifications[0].message.substring(0, 50)}...
                </div>
              </div>
            ) : (
              <p className="text-muted">Aucune notification</p>
            )}
          </div>
        </div>

        <div className="overview-card">
          <div className="card-header">
            <h4>
              <i className="fas fa-shopping-cart me-2"></i>
              Courses
            </h4>
          </div>
          <div className="card-body">
            {shoppingList.length > 0 ? (
              <div className="shopping-preview">
                <p>{shoppingList.filter((item) => !item.purchased).length} articles à acheter</p>
                <div className="progress">
                  <div
                    className="progress-bar bg-info"
                    style={{
                      width: `${(shoppingList.filter((item) => item.purchased).length / shoppingList.length) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            ) : (
              <p className="text-muted">Liste vide</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;