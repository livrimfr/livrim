import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, MapPin, Calendar, Clock, Send, CheckCircle2, MessageSquare } from 'lucide-react';
import './OrderTrackingPage.css';

const API_URL = 'http://localhost:3000/api/requests';

export default function OrderTrackingPage() {
  const [trackingId, setTrackingId] = useState('');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchOrder = async (id, showLoader = true) => {
    if (showLoader) setIsLoading(true);
    setError('');
    
    try {
      const resp = await fetch(`${API_URL}/${id}`);
      if (resp.ok) {
        const data = await resp.json();
        setOrder(data);
      } else {
        setError("Commande introuvable. Veuillez vérifier votre numéro de suivi.");
        if (showLoader) setOrder(null);
      }
    } catch (err) {
      console.error(err);
      setError("Erreur de connexion au serveur.");
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!trackingId.trim()) return;
    fetchOrder(trackingId.trim());
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !order) return;

    setIsSending(true);
    try {
      const resp = await fetch(`${API_URL}/${order.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message })
      });
      if (resp.ok) {
        setMessage('');
        fetchOrder(order.id, false); // silent refresh
      }
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setIsSending(false);
    }
  };

  // Auto-refresh chat
  useEffect(() => {
    let interval;
    if (order) {
      interval = setInterval(() => {
        fetchOrder(order.id, false);
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [order?.id]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [order?.messages]);

  const getStatusDisplay = (status) => {
    const steps = [
      { id: 'Pending', label: 'En attente' },
      { id: 'Pickup Scheduled', label: 'Collecte prévue' },
      { id: 'Books Collected', label: 'Livres collectés' },
      { id: 'Books Sold', label: 'Livres vendus' },
      { id: 'Payment Sent', label: 'Paiement envoyé' }
    ];
    
    const currentIndex = steps.findIndex(s => s.id === status);
    
    return (
      <div className="status-tracker">
        {steps.map((step, index) => {
          let stateClass = '';
          if (index < currentIndex) stateClass = 'completed';
          else if (index === currentIndex) stateClass = 'active';
          
          return (
            <div key={step.id} className={`status-step ${stateClass}`}>
              <div className="step-circle">
                {index < currentIndex ? <CheckCircle2 size={16} /> : (index + 1)}
              </div>
              <span className="step-label">{step.label}</span>
              {index < steps.length - 1 && <div className="step-line"></div>}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="tracking-page">
      <div className="page-header">
        <div className="container header-container text-center">
          <h1>Suivre ma Collecte</h1>
          <p>Entrez votre numéro de suivi pour voir l'avancement et discuter avec l'équipe.</p>
          
          <form onSubmit={handleSearch} className="tracking-search-form mt-4">
            <input 
              type="text" 
              placeholder="Ex: a1b2c3d4e..." 
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              className="tracking-input"
            />
            <button type="submit" className="btn btn-primary tracking-btn" disabled={isLoading}>
              {isLoading ? 'Recherche...' : <><Search size={20} className="mr-2" /> Rechercher</>}
            </button>
          </form>
          {error && <p className="text-danger mt-3">{error}</p>}
        </div>
      </div>

      {order && (
        <div className="container section tracking-content">
          <div className="tracking-grid">
            
            {/* Left Column: Details & Status */}
            <div className="tracking-details card">
              <h2 className="mb-4">Commande #{order.id}</h2>
              
              <div className="status-container mb-6">
                {getStatusDisplay(order.status)}
              </div>

              <div className="details-list">
                <div className="detail-item">
                  <Package className="text-muted mr-3" size={20} />
                  <div>
                    <span className="text-muted text-small d-block">Quantité estimée</span>
                    <strong>{order.bookCount} livres</strong>
                  </div>
                </div>
                <div className="detail-item">
                  <MapPin className="text-muted mr-3" size={20} />
                  <div>
                    <span className="text-muted text-small d-block">Adresse de collecte</span>
                    <strong>{order.address}, {order.postalCode}</strong>
                  </div>
                </div>
                <div className="detail-item">
                  <Clock className="text-muted mr-3" size={20} />
                  <div>
                    <span className="text-muted text-small d-block">Disponibilité</span>
                    <strong>{order.availability}</strong>
                  </div>
                </div>
                <div className="detail-item">
                  <Calendar className="text-muted mr-3" size={20} />
                  <div>
                    <span className="text-muted text-small d-block">Date de demande</span>
                    <strong>{new Date(order.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Chat Box */}
            <div className="tracking-chat card flex-column">
              <div className="chat-header border-bottom pb-3 mb-3">
                <h3 className="flex-center m-0"><MessageSquare size={20} className="mr-2 primary-icon" /> Messagerie en direct</h3>
                <p className="text-muted text-small m-0 mt-1">Discutez avec notre équipe / Recevez vos infos d'expédition</p>
              </div>

              <div className="chat-messages flex-grow-1">
                {order.parcelTracking && (
                  <div className="parcel-tracking-banner">
                    <span>📦</span>
                    <div>
                      <strong>Numéro de colis :</strong> {order.parcelTracking}
                      <a
                        href={`https://www.laposte.fr/outils/suivre-vos-envois?code=${order.parcelTracking}`}
                        target="_blank" rel="noopener noreferrer"
                        className="tracking-link"
                      >
                        Suivre mon colis →
                      </a>
                    </div>
                  </div>
                )}
                {(!order.messages || order.messages.length === 0) ? (
                  <div className="empty-chat text-muted text-center flex-center h-100 flex-column">
                    <MessageSquare size={32} opacity={0.5} className="mb-2" />
                    <p>Aucun message pour le moment.</p>
                  </div>
                ) : (
                  order.messages.map((msg, idx) => (
                    <div key={idx} className={`chat-bubble-wrapper ${msg.sender === 'User' ? 'user' : 'admin'}`}>
                      <div className={`chat-bubble ${msg.isTracking ? 'tracking-bubble' : ''}`}>
                        <span className="sender-name">{msg.sender === 'User' ? 'Vous' : 'Équipe Gien'}</span>
                        {msg.isTracking ? (
                          <p dangerouslySetInnerHTML={{ __html: msg.text
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(
                              /(https?:\/\/\S+)/g,
                              '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:inherit;font-weight:bold;">🔗 Suivre mon colis ici</a>'
                            )
                          }} />
                        ) : (
                          <p>{msg.text}</p>
                        )}
                        <span className="timestamp">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="chat-input-form mt-3 pt-3 border-top">
                <input 
                  type="text" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Écrivez votre message..." 
                  className="form-input flex-grow-1 mr-2"
                  disabled={isSending}
                />
                <button type="submit" className="btn btn-primary p-2 flex-center" disabled={!message.trim() || isSending} title="Envoyer">
                  <Send size={20} />
                </button>
              </form>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
