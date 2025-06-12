"use client"

import { useState, useEffect, useRef } from "react"
import { auth, db } from "../firebase"
import { collection, getDocs } from "firebase/firestore"
import { useLanguage } from "../contexts/LanguageContext"

const AIChat = () => {
  const { t } = useLanguage()
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [userContext, setUserContext] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    console.log("AIChat monté")
    loadUserContext()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadUserContext = async () => {
    if (!auth.currentUser) {
      console.log("Aucun utilisateur connecté")
      return
    }

    try {
      const [dishesSnapshot, ingredientsSnapshot, recipesSnapshot] = await Promise.all([
        getDocs(collection(db, "users", auth.currentUser.uid, "dishes")),
        getDocs(collection(db, "users", auth.currentUser.uid, "ingredients")),
        getDocs(collection(db, "recipes")),
      ])

      const dishes = dishesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      const ingredients = ingredientsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      const recipes = recipesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

      setUserContext({ dishes, ingredients, recipes })
      console.log("Contexte chargé:", { dishes, ingredients, recipes })
    } catch (error) {
      console.error("Erreur lors du chargement du contexte:", error)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return

    const userMessage = inputMessage.trim()
    setInputMessage("")
    setLoading(true)

    const newMessages = [...messages, { type: "user", content: userMessage, timestamp: new Date() }]
    setMessages(newMessages)

    try {
      const context = {
        userDishes: userContext?.dishes || [],
        userIngredients: userContext?.ingredients || [],
        availableRecipes: userContext?.recipes || [],
        userMessage: userMessage,
      }

      const response = await fetch("http://localhost:3001/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(context),
      })

      if (!response.ok) {
        throw new Error("Erreur de communication avec le chatbot")
      }

      const data = await response.json()

      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          content: data.response,
          suggestions: data.suggestions || [],
          timestamp: new Date(),
        },
      ])
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error)
      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          content: "Désolé, je rencontre des difficultés techniques. Veuillez réessayer plus tard.",
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleContainerClick = (e) => {
    e.stopPropagation()
    console.log("Clic dans la fenêtre du chatbot")
  }

  const suggestionsExamples = [
    "Propose-moi une recette camerounaise avec du poisson",
    "Que puis-je cuisiner avec mes ingrédients disponibles ?",
    "Donne-moi une recette végétarienne rapide",
    "Quels plats puis-je faire avec du plantain ?",
    "Propose un menu équilibré pour la semaine",
  ]

  console.log("Rendu de la fenêtre du chatbot")
  return (
    <div
      className="ai-chat-container"
      onClick={handleContainerClick}
      style={{
        width: "400px",
        height: "600px",
        borderRadius: "20px",
        overflow: "hidden",
        background: "rgba(255, 255, 255, 0.98)",
        boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
        border: "1px solid rgba(255, 255, 255, 0.3)",
      }}
    >
      <div className="card h-100 border-0" style={{ borderRadius: "20px" }}>
        <div
          className="card-header text-white d-flex justify-content-between align-items-center"
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "20px 20px 0 0",
            padding: "15px 20px",
          }}
        >
          <div className="d-flex align-items-center">
            <div
              className="me-2 d-flex align-items-center justify-content-center"
              style={{
                width: "35px",
                height: "35px",
                background: "rgba(255, 255, 255, 0.2)",
                borderRadius: "50%",
              }}
            >
              <i className="fas fa-robot"></i>
            </div>
            <div>
              <div className="fw-bold">Assistant Culinaire IA</div>
              <small style={{ opacity: 0.8 }}>En ligne</small>
            </div>
          </div>
          <button
            className="btn btn-sm text-white"
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              border: "none",
              borderRadius: "50%",
              width: "30px",
              height: "30px",
            }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="card-body d-flex flex-column p-0">
          <div className="flex-grow-1 p-3" style={{ overflowY: "auto", maxHeight: "450px" }}>
            {messages.length === 0 && (
              <div className="text-center text-muted py-4">
                <div
                  className="mb-3 mx-auto d-flex align-items-center justify-content-center"
                  style={{
                    width: "60px",
                    height: "60px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    borderRadius: "50%",
                    color: "white",
                  }}
                >
                  <i className="fas fa-robot fa-2x"></i>
                </div>
                <h6 className="fw-bold mb-2">Bonjour ! 👋</h6>
                <p className="small mb-3">
                  Je suis votre assistant culinaire IA. Posez-moi des questions sur les recettes, les ingrédients ou
                  demandez-moi des suggestions de plats !
                </p>

                <div className="mt-3">
                  <small className="text-muted fw-bold d-block mb-2">Exemples de questions :</small>
                  {suggestionsExamples.map((suggestion, index) => (
                    <button
                      key={index}
                      className="btn btn-sm btn-outline-primary m-1"
                      style={{
                        borderRadius: "15px",
                        fontSize: "11px",
                        padding: "5px 10px",
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        console.log("Suggestion cliquée:", suggestion)
                        setInputMessage(suggestion)
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div key={index} className={`mb-3 ${message.type === "user" ? "text-end" : "text-start"}`}>
                <div
                  className={`d-inline-block p-3 ${message.type === "user" ? "text-white" : "bg-light text-dark"}`}
                  style={{
                    maxWidth: "80%",
                    borderRadius: message.type === "user" ? "20px 20px 5px 20px" : "20px 20px 20px 5px",
                    background:
                      message.type === "user" ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "#f8f9fa",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                  }}
                >
                  <div style={{ whiteSpace: "pre-wrap", fontSize: "14px" }}>{message.content}</div>
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-2">
                      <small className="text-muted">Suggestions :</small>
                      {message.suggestions.map((suggestion, idx) => (
                        <div key={idx} className="mt-1">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            style={{ borderRadius: "15px", fontSize: "11px" }}
                            onClick={(e) => {
                              e.stopPropagation()
                              console.log("Suggestion AI cliquée:", suggestion)
                              setInputMessage(suggestion)
                            }}
                          >
                            {suggestion}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="small text-muted mt-1" style={{ fontSize: "11px" }}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}

            {loading && (
              <div className="text-start mb-3">
                <div
                  className="d-inline-block p-3 bg-light"
                  style={{
                    borderRadius: "20px 20px 20px 5px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                  }}
                >
                  <div className="d-flex align-items-center">
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <span className="small">L'assistant réfléchit...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-top" style={{ background: "#f8f9fa" }}>
            <div className="input-group">
              <textarea
                className="form-control border-0"
                placeholder="Posez votre question culinaire..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                onClick={(e) => e.stopPropagation()}
                rows="2"
                style={{
                  resize: "none",
                  borderRadius: "15px 0 0 15px",
                  background: "white",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                  transition: "none",
                }}
              />
              <button
                className="btn text-white border-0"
                onClick={(e) => {
                  e.stopPropagation()
                  sendMessage()
                }}
                disabled={loading || !inputMessage.trim()}
                style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  borderRadius: "0 15px 15px 0",
                  minWidth: "50px",
                  transition: "none",
                }}
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIChat