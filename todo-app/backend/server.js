// backend/server.js

// Importation des modules nécessaires
import express from 'express'; // Framework web pour créer l'API
import nodemailer from 'nodemailer'; // Pour l'envoi d'e-mails
import { GoogleGenerativeAI } from '@google/generative-ai'; // Pour l'intégration de l'API Gemini
import dotenv from 'dotenv'; // Pour charger les variables d'environnement depuis un fichier .env (en développement local)
import cors from 'cors'; // Pour gérer les requêtes Cross-Origin Resource Sharing (CORS) depuis ton frontend React

// Charge les variables d'environnement depuis le fichier .env
// Ceci est utilisé uniquement en développement local. En production sur Render,
// les variables d'environnement seront configurées directement sur la plateforme.
dotenv.config();

// Initialisation de l'application Express
const app = express();
// Définition du port d'écoute du serveur.
// process.env.PORT est utilisé en production (par exemple, par Render),
// 3001 est le port par défaut pour le développement local.
const port = process.env.PORT || 3001;

// --- Middlewares ---
// Middleware pour analyser le corps des requêtes entrantes au format JSON.
// Cela permet d'accéder aux données envoyées par le frontend via req.body.
app.use(express.json());

// Middleware CORS pour autoriser les requêtes depuis ton frontend React.
// Sans cela, le navigateur bloquerait les requêtes de ton frontend (qui est sur un domaine/port différent)
// vers ton backend.
// Pour une sécurité accrue en production, tu peux spécifier l'origine de ton frontend :
// app.use(cors({ origin: 'https://ton-domaine-frontend.com' }));
app.use(cors());

// --- Configuration Nodemailer ---
// Création d'un transporteur Nodemailer pour l'envoi d'e-mails.
// Exemple configuré pour Gmail.
const transporter = nodemailer.createTransport({
  service: 'gmail', // Utilise le service Gmail
  auth: {
    user: process.env.GMAIL_EMAIL, // Adresse e-mail de l'expéditeur (chargée depuis les variables d'environnement)
    pass: process.env.GMAIL_PASSWORD, // Mot de passe d'application Gmail (chargé depuis les variables d'environnement)
  },
});

// --- Initialisation de l'API Gemini ---
// Création d'une instance de GoogleGenerativeAI avec la clé API.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_APIKEY);
// Récupération du modèle Gemini à utiliser (gemini-1.5-pro dans cet exemple).
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

// --- Fonction de génération de contenu d'e-mail avec Gemini ---
/**
 * Génère le contenu d'un e-mail personnalisé pour un plan de repas hebdomadaire
 * en utilisant l'API Gemini.
 * @param {object} member - Informations sur le membre (fullName, age, etc.).
 * @param {object} mealPlan - Le plan de repas hebdomadaire.
 * @param {object} generativeModel - L'instance du modèle Gemini.
 * @returns {Promise<string>} Le contenu de l'e-mail généré.
 */
async function generateEmailContent(member, mealPlan, generativeModel) {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  // Formate le plan de repas en une liste lisible pour l'e-mail.
  const mealPlanList = days.map(day => {
    const dishName = mealPlan[day] || 'Aucun plat';
    return `${day.charAt(0).toUpperCase() + day.slice(1)} : ${dishName}`;
  }).join('\n');

  // Le prompt envoyé à Gemini pour générer le message d'introduction de l'e-mail.
  const prompt = `
    Générez un message d'email pour un plan de repas hebdomadaire destiné à une personne de ${member.age} ans nommée ${member.fullName}. Adaptez le ton :
    - Pour un enfant (< 12 ans) : ludique, simple, avec des emojis.
    - Pour un adolescent (12-17 ans) : décontracté, motivant.
    - Pour un adulte (≥ 18 ans) : professionnel, informatif.
    Le message doit inclure une salutation et une introduction au plan de repas. Exemple de plats : ${mealPlanList.replace('\n', ', ')}. Ne pas lister les plats dans le message, juste introduire le plan. Retournez uniquement le message sans autre texte.
  `;

  // Appel de l'API Gemini pour obtenir le message.
  const result = await generativeModel.generateContent(prompt);
  const message = result.response.text();

  // Construction du contenu final de l'e-mail.
  return `
    ${message}

    Voici le plan de repas pour la semaine :
    ${mealPlanList}

    Cordialement,
    L'Équipe de Planification Familiale
  `;
}

// --- Point d'API pour envoyer les e-mails ---
// Cette route répond aux requêtes POST sur '/send-meal-plan-emails'.
app.post('/send-meal-plan-emails', async (req, res) => {
  // Extraction des données du corps de la requête.
  const { userId, members, mealPlan } = req.body;

  // Vérification de la présence des données essentielles.
  if (!userId || !members || !mealPlan) {
    return res.status(400).json({ error: 'Données manquantes. Assurez-vous d\'envoyer userId, members et mealPlan.' });
  }

  try {
    // Boucle sur chaque membre pour envoyer un e-mail personnalisé.
    for (const member of members) {
      // Vérification que les informations essentielles du membre sont présentes.
      if (!member.email || !member.fullName || !member.age) {
        console.warn(`Membre ${member.id} ignoré : email, nom ou âge manquant.`);
        continue; // Passe au membre suivant si des informations sont manquantes.
      }

      // Génération du contenu de l'e-mail en utilisant la fonction et le modèle Gemini.
      const emailContent = await generateEmailContent(member, mealPlan, model);

      // Options de l'e-mail pour Nodemailer.
      const mailOptions = {
        from: process.env.GMAIL_EMAIL, // Expéditeur
        to: member.email, // Destinataire
        subject: 'Votre Plan de Repas Hebdomadaire', // Sujet de l'e-mail
        text: emailContent, // Contenu de l'e-mail
      };

      // Envoi de l'e-mail.
      await transporter.sendMail(mailOptions);
      console.log(`Email envoyé à ${member.email}`);
    }

    // Réponse de succès si tous les e-mails ont été traités.
    return res.status(200).json({ message: 'Emails envoyés avec succès.' });
  } catch (error) {
    // Gestion des erreurs lors de l'envoi des e-mails.
    console.error('Erreur lors de l\'envoi des emails : ', error);
    return res.status(500).json({ error: error.message || 'Une erreur interne est survenue.' });
  }
});

// --- Route de test simple ---
// Une route GET simple pour vérifier si le serveur est en cours d'exécution.
app.get('/', (req, res) => {
  res.send('Backend for todo-app is running!');
});

// --- Démarrage du serveur ---
// Le serveur commence à écouter les requêtes sur le port spécifié.
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
