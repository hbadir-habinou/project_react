// functions/index.js
import functions from 'firebase-functions';
import nodemailer from 'nodemailer';
import { GoogleGenerativeAI } from '@google/generative-ai';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().gmail.email,
    pass: functions.config().gmail.password,
  },
});

const genAI = new GoogleGenerativeAI(functions.config().gemini.apikey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

async function generateEmailContent(member, mealPlan, generativeModel) {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const mealPlanList = days.map(day => {
    const dishName = mealPlan[day] || 'Aucun plat';
    return `${day.charAt(0).toUpperCase() + day.slice(1)} : ${dishName}`;
  }).join('\n');

  const prompt = `
    Générez un message d'email pour un plan de repas hebdomadaire destiné à une personne de ${member.age} ans nommée ${member.fullName}. Adaptez le ton :
    - Pour un enfant (< 12 ans) : ludique, simple, avec des emojis.
    - Pour un adolescent (12-17 ans) : décontracté, motivant.
    - Pour un adulte (≥ 18 ans) : professionnel, informatif.
    Le message doit inclure une salutation et une introduction au plan de repas. Exemple de plats : ${mealPlanList.replace('\n', ', ')}. Ne pas lister les plats dans le message, juste introduire le plan. Retournez uniquement le message sans autre texte.
  `;

  const result = await generativeModel.generateContent(prompt);
  const message = result.response.text();

  return `
    ${message}

    Voici le plan de repas pour la semaine :
    ${mealPlanList}

    Cordialement,
    L'Équipe de Planification Familiale
  `;
}

export const sendMealPlanEmails = functions.https.onRequest(async (req, res) => {
  const { userId, members, mealPlan } = req.body;

  if (!userId || !members || !mealPlan) {
    return res.status(400).json({ error: 'Données manquantes.' });
  }

  try {
    for (const member of members) {
      if (!member.email || !member.fullName || !member.age) {
        console.warn(`Membre ${member.id} ignoré : email, nom ou âge manquant.`);
        continue;
      }

      const emailContent = await generateEmailContent(member, mealPlan, model);

      const mailOptions = {
        from: functions.config().gmail.email,
        to: member.email,
        subject: 'Votre Plan de Repas Hebdomadaire',
        text: emailContent,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email envoyé à ${member.email}`);
    }

    return res.status(200).json({ message: 'Emails envoyés avec succès.' });
  } catch (error) {
    console.error('Erreur lors de l\'envoi des emails : ', error);
    return res.status(500).json({ error: error.message });
  }
});