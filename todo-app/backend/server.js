import express from "express"
import nodemailer from "nodemailer"
import { GoogleGenerativeAI } from "@google/generative-ai"
import dotenv from "dotenv"
import cors from "cors"
import fs from "fs"
import path from "path"
import PDFParser from "pdf2json"
import { handleChatRequest } from "./chatbot.js"

// Importations spécifiques pour __dirname dans les modules ES
import { fileURLToPath } from "url"
import { dirname } from "path"

// Obtenir l'équivalent de __filename et __dirname pour les modules ES
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config()

const app = express()
const port = process.env.PORT || 3001

// Middlewares
app.use(cors())
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_PASSWORD,
  },
})

// Gemini configuration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_APIKEY)

// Chemin vers le PDF
const pdfPath = path.join(__dirname, "assets", "Recettes-de-cuisine-Camerounaise.pdf")

// Generate email content
async function generateEmailContent(member, mealPlan) {
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
  const mealPlanList = days
    .map((day) => {
      const dishName = mealPlan[day] || "Aucun plat"
      return `${day.charAt(0).toUpperCase() + day.slice(1)} : ${dishName}`
    })
    .join("\n")

  const prompt = `
    Générez un message d'email pour un plan de repas hebdomadaire destiné à une personne de ${member.age} ans nommée ${member.fullName}. Adaptez le ton :
    - Pour un enfant (< 12 ans) : ludique, simple, avec des emojis.
    - Pour un adolescent (12-17 ans) : décontracté, motivant.
    - Pour un adulte (≥ 18 ans) : professionnel, informatif.
    Le message doit inclure une salutation et une introduction au plan de repas, le plan de repas doit être dans un joli tableau . Exemple de plats : ${mealPlanList.replace("\n", ", ")}. Ne pas lister les plats dans le message, juste introduire le plan. Retournez uniquement le message  sans autre texte.
  `

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    const result = await model.generateContent(prompt)
    const message = result.response.text()

    // Construction du tableau HTML pour le plan de repas avec un meilleur style
    const mealPlanTable = `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <thead>
            <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
              <th style="border: none; padding: 15px 20px; text-align: left; font-weight: 600; font-size: 16px;">📅 Jour</th>
              <th style="border: none; padding: 15px 20px; text-align: left; font-weight: 600; font-size: 16px;">🍽️ Plat</th>
            </tr>
          </thead>
          <tbody>
            ${days
              .map((day, index) => {
                const isWeekend = day === "saturday" || day === "sunday"
                const dayEmojis = {
                  monday: "🌟",
                  tuesday: "💪",
                  wednesday: "🔥",
                  thursday: "⚡",
                  friday: "🎉",
                  saturday: "🌈",
                  sunday: "☀️",
                }
                const dayNames = {
                  monday: "Lundi",
                  tuesday: "Mardi",
                  wednesday: "Mercredi",
                  thursday: "Jeudi",
                  friday: "Vendredi",
                  saturday: "Samedi",
                  sunday: "Dimanche",
                }

                return `
                <tr style="background-color: ${isWeekend ? "#e8f5e8" : index % 2 === 0 ? "#ffffff" : "#f8f9fa"}; transition: background-color 0.3s ease;">
                  <td style="border: none; padding: 15px 20px; border-bottom: 1px solid #e9ecef; font-weight: 500; color: #495057;">
                    ${dayEmojis[day]} ${dayNames[day]}
                  </td>
                  <td style="border: none; padding: 15px 20px; border-bottom: 1px solid #e9ecef; color: #6c757d; font-style: ${mealPlan[day] ? "normal" : "italic"};">
                    ${mealPlan[day] || "🍽️ Aucun plat prévu"}
                  </td>
                </tr>
              `
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `

    return `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 300;">🍽️ Plan de Repas Hebdomadaire</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Votre menu personnalisé pour la semaine</p>
        </div>
        
        <div style="background-color: white; padding: 30px 20px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="margin-bottom: 25px; padding: 20px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #667eea;">
            ${message}
          </div>

          <div style="margin: 25px 0;">
            <h2 style="color: #495057; font-size: 22px; margin-bottom: 15px; text-align: center;">
              📋 Votre planning de la semaine
            </h2>
            ${mealPlanTable}
          </div>

          <div style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 8px; text-align: center;">
            <p style="color: white; margin: 0; font-size: 16px; font-weight: 500;">
              ✨ Bon appétit et excellente semaine ! ✨
            </p>
          </div>

          <div style="margin-top: 25px; padding-top: 20px; border-top: 2px solid #e9ecef; text-align: center; color: #6c757d;">
            <p style="margin: 0; font-size: 14px;">
              Cordialement,<br>
              <strong style="color: #667eea;">L'Équipe de Planification Familiale</strong>
            </p>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #adb5bd;">
              📧 Cet email a été généré automatiquement pour vous aider dans votre planification culinaire
            </p>
          </div>
        </div>
      </div>
    `
  } catch (error) {
    console.error(`Erreur Gemini pour ${member.email}:`, error.stack)
    throw new Error(`Erreur Gemini: ${error.message}`)
  }
}

// Send meal plan emails
app.post("/send-meal-plan-emails", async (req, res) => {
  console.log("Requête reçue:", req.body)
  if (!req.body) {
    console.error("Corps de la requête manquant")
    return res.status(400).json({ error: "Corps de la requête manquant." })
  }

  const { userId, members, mealPlan } = req.body

  if (!userId || !members || !mealPlan) {
    console.error("Données manquantes:", { userId, members, mealPlan })
    return res.status(400).json({ error: "Données manquantes." })
  }

  try {
    for (const member of members) {
      if (!member.email || !member.fullName || !member.age) {
        console.warn(`Membre ${member.id} ignoré : email, nom ou âge manquant.`)
        continue
      }

      console.log(`Génération de contenu pour ${member.email}`)
      const emailContent = await generateEmailContent(member, mealPlan)
      console.log(`Contenu généré pour ${member.email}`)

      const mailOptions = {
        from: process.env.GMAIL_EMAIL,
        to: member.email,
        subject: "Votre Plan de Repas Hebdomadaire",
        html: emailContent,
      }

      console.log(`Envoi d'email à ${member.email}`)
      await transporter.sendMail(mailOptions)
      console.log(`Email envoyé à ${member.email}`)
    }

    return res.status(200).json({ message: "Emails envoyés avec succès." })
  } catch (error) {
    console.error("Erreur détaillée:", error.stack)
    return res.status(500).json({ error: error.message || "Erreur interne." })
  }
})

// Propose 7 random recipes
app.get("/propose-recipes", async (req, res) => {
  try {
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: "Fichier PDF introuvable à: " + pdfPath })
    }

    const pdfBuffer = fs.readFileSync(pdfPath)
    const pdfParser = new PDFParser()

    let pdfText = ""

    await new Promise((resolve, reject) => {
      pdfParser.on("pdfParser_dataReady", (pdfData) => {
        pdfData.Pages.forEach((page) => {
          page.Texts.forEach((textItem) => {
            textItem.R.forEach((textRun) => {
              pdfText += decodeURIComponent(textRun.T)
            })
          })
          pdfText += "\n"
        })
        resolve()
      })

      pdfParser.on("pdfParser_dataError", (errData) => {
        console.error("Erreur PDFParser:", errData.parserError)
        reject(new Error("Erreur lors de l'analyse du PDF avec pdf2json: " + errData.parserError))
      })

      pdfParser.parseBuffer(pdfBuffer)
    })

    if (
      !pdfText.includes("Ingrédients") &&
      !pdfText.includes("Préparation") &&
      !pdfText.includes("ingredients") &&
      !pdfText.includes("preparation")
    ) {
      return res
        .status(400)
        .json({ error: "Le PDF ne semble pas contenir de recettes valides ou le texte n'a pas pu être extrait." })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    const prompt = `
      Voici le contenu d'un document de recettes camerounaises :
      ${pdfText.substring(0, 30000)} 

      Identifiez toutes les recettes dans ce texte. Chaque recette doit inclure :
      - Un nom (titre de la recette).
      - Une liste d'ingrédients (séparés par des virgules, retours à la ligne ou puces).
      - Des instructions de préparation (étapes détaillées).

      Sélectionnez "aléatoirement" 7 recettes et retournez-les au format JSON suivant, entouré de \`\`\`json\n et \n\`\`\` :
      \`\`\`json
      [
        {
          "name": "Nom de la recette",
          "ingredients": ["ingrédient 1", "ingrédient 2", ...],
          "instructions": "Instructions détaillées"
        },
        ...
      ]
      \`\`\`

      Ne modifiez pas le contenu du document. Extrayez uniquement les 7 recettes aléatoirement telles qu'elles apparaissent. Si moins de 7 recettes sont disponibles, retournez toutes les recettes trouvées. Assurez-vous que le JSON est valide.
    `

    const result = await model.generateContent(prompt)
    const recipesText = result.response.text()

    const jsonMatch = recipesText.match(/```json\n([\s\S]*?)\n```/)
    if (!jsonMatch || !jsonMatch[1]) {
      throw new Error("Réponse de Gemini mal formatée : JSON introuvable.")
    }

    let recipes
    try {
      recipes = JSON.parse(jsonMatch[1])
    } catch (e) {
      throw new Error("Erreur de parsing JSON : " + e.message)
    }

    if (!Array.isArray(recipes)) {
      throw new Error("Gemini n'a pas retourné un tableau de recettes.")
    }

    if (recipes.length < 7) {
      console.warn(`Seulement ${recipes.length} recettes extraites au lieu de 7.`)
    }

    res.json({ recipes })
  } catch (error) {
    console.error("Erreur lors de la proposition de recettes:", error.stack)
    res.status(500).json({ error: error.message || "Erreur interne." })
  }
})

// Chatbot endpoint
app.post("/chat", handleChatRequest)

// Serve the recipe PDF
app.get("/get-recipe-pdf", (req, res) => {
  if (!fs.existsSync(pdfPath)) {
    return res.status(404).json({ error: "Fichier PDF introuvable." })
  }
  res.sendFile(pdfPath)
})

// Test routes
app.get("/", (req, res) => {
  res.send("Backend for FoodPlanner is running!")
})

app.get("/test-env", (req, res) => {
  res.json({
    gmailEmail: !!process.env.GMAIL_EMAIL,
    gmailPassword: !!process.env.GMAIL_PASSWORD,
    geminiApiKey: !!process.env.GEMINI_APIKEY,
  })
})

app.get("/test-email", async (req, res) => {
  try {
    const mailOptions = {
      from: process.env.GMAIL_EMAIL,
      to: process.env.GMAIL_EMAIL,
      subject: "Test Email",
      text: "Ceci est un test depuis Nodemailer.",
    }
    await transporter.sendMail(mailOptions)
    console.log("Email de test envoyé")
    res.json({ message: "Email de test envoyé" })
  } catch (error) {
    console.error("Erreur test email:", error.stack)
    return res.status(500).json({ error: error.message })
  }
})

app.get("/test-gemini", async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    const result = await model.generateContent("Bonjour, ceci est un test.")
    console.log("Réponse Gemini:", result.response.text())
    res.json({ message: "Test Gemini réussi", response: result.response.text() })
  } catch (error) {
    console.error("Erreur test Gemini:", error.stack)
    return res.status(500).json({ error: error.message })
  }
})


// Start server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
