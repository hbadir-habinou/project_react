"use client"

import { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";

const WhatsAppShare = ({ mealPlan, dishes, recipes }) => {
  const { t } = useLanguage();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  const generateMealPlanText = () => {
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const dayNames = {
      monday: t("days.monday"),
      tuesday: t("days.tuesday"),
      wednesday: t("days.wednesday"),
      thursday: t("days.thursday"),
      friday: t("days.friday"),
      saturday: t("days.saturday"),
      sunday: t("days.sunday"),
    };

    let message = "🍽️ *Menu de la Semaine* 🍽️\n\n";

    days.forEach((day) => {
      const dishId = mealPlan[day];
      let dishName = t("noDish");

      if (dishId) {
        const dish = dishes.find((d) => d.id === dishId) || recipes.find((r) => r.id === dishId);
        dishName = dish ? dish.name : t("dishNotFound");
      }

      message += `📅 *${dayNames[day]}*: ${dishName}\n`;
    });

    message += "\n✨ Bon appétit ! ✨";

    if (customMessage.trim()) {
      message += `\n\n💬 ${customMessage}`;
    }

    return message;
  };

  const shareViaWhatsApp = () => {
    const message = generateMealPlanText();
    const encodedMessage = encodeURIComponent(message);

    let whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

    if (phoneNumber.trim()) {
      const cleanNumber = phoneNumber.replace(/[^\d+]/g, "");
      whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
    }

    window.open(whatsappUrl, "_blank");
  };

  const copyToClipboard = () => {
    const message = generateMealPlanText();
    navigator.clipboard.writeText(message).then(() => {
      alert(t("copiedToClipboard"));
    });
  };

  return (
    <div className="whatsapp-share-component">
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="fab fa-whatsapp me-2 text-success"></i>
            {t("shareWhatsApp")}
          </h5>
        </div>
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label">
              <i className="fas fa-phone me-1"></i>
              {t("phoneNumber")}
            </label>
            <input
              type="tel"
              className="form-control"
              placeholder="+237 6XX XXX XXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <small className="text-muted">{t("phoneOptional")}</small>
          </div>

          <div className="mb-3">
            <label className="form-label">
              <i className="fas fa-comment me-1"></i>
              {t("customMessage")}
            </label>
            <textarea
              className="form-control"
              rows="3"
              placeholder={t("customMessagePlaceholder")}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">{t("messagePreview")}:</label>
            <div className="bg-light p-3 rounded border">
              <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.9rem" }}>{generateMealPlanText()}</pre>
            </div>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            <button className="btn btn-success" onClick={shareViaWhatsApp}>
              <i className="fab fa-whatsapp me-2"></i>
              {t("shareMobile")}
            </button>
            <button className="btn btn-outline-primary" onClick={copyToClipboard}>
              <i className="fas fa-copy me-2"></i>
              {t("copyText")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppShare;