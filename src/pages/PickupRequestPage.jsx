import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import './PickupRequestPage.css';

export default function PickupRequestPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdId, setCreatedId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    postalCode: '',
    bookCount: '20-50',
    availability: 'Matin (Semaine)',
    agreement: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newId = Math.random().toString(36).substr(2, 9);
    setCreatedId(newId);

    try {
      const response = await fetch('http://localhost:3000/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newId,
          ...formData
        })
      });

      if (!response.ok) throw new Error("Erreur serveur");

      setIsSubmitting(false);
      setIsSuccess(true);
    } catch (error) {
      console.error("Erreur:", error);
      setIsSubmitting(false);
      alert("Erreur réseau");
    }
  };

  if (isSuccess) {
    return (
      <div className="container section success-container">
        <div className="card success-card">
          <CheckCircle2 size={64} className="accent-icon mb-4" />
          <h1>Demande Envoyée !</h1>
          <p>Merci {formData.name}, votre demande a été enregistrée avec succès.</p>
          
          <div className="tracking-info-box mt-4 mb-4" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', padding: '1.5rem', borderRadius: '12px', border: '1px border var(--primary-color)' }}>
            <h3 style={{ color: 'var(--primary-color)', margin: '0 0 0.5rem 0' }}>Votre numéro de suivi :</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '2px', userSelect: 'all', margin: 0 }}>{createdId}</p>
            <p className="text-small text-muted mt-2">Gardez ce numéro précieusement. Il vous permet de suivre l'avancée de votre vente et de chatter avec nous !</p>
          </div>

          <div className="flex-center gap-4 mt-6">
            <a href="/suivi" className="btn btn-primary">Aller au suivi de commande</a>
            <button onClick={() => { setIsSuccess(false); setCreatedId(''); }} className="btn btn-outline">Faire une autre demande</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pickup-page">
      <div className="page-header">
        <div className="container header-container">
          <h1>Planifier une Collecte</h1>
          <p>Remplissez les détails ci-dessous. Nous venons chez vous récupérer vos livres gratuitement.</p>
        </div>
      </div>

      <div className="container section form-section">
        <form onSubmit={handleSubmit} className="pickup-form card">
          
          <div className="form-section-title">
            <h3>Informations Personnelles</h3>
          </div>
          
          <div className="form-row">
            <div className="form-group w-50">
              <label className="form-label">Nom complet *</label>
              <input type="text" name="name" required className="form-input" value={formData.name} onChange={handleChange} placeholder="Jean Dupont" />
            </div>
            <div className="form-group w-50">
              <label className="form-label">Numéro de téléphone *</label>
              <input type="tel" name="phone" required className="form-input" value={formData.phone} onChange={handleChange} placeholder="06 12 34 56 78" />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Email (Optionnel)</label>
            <input type="email" name="email" className="form-input" value={formData.email} onChange={handleChange} placeholder="jean.dupont@email.com" />
          </div>

          <div className="form-section-title mt-4">
            <h3>Adresse de Collecte</h3>
            <div className="area-alert">
              <AlertCircle size={16} />
              <span>La collecte est actuellement disponible uniquement à <strong>Gien et ses environs (15km)</strong>.</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Adresse *</label>
            <input type="text" name="address" required className="form-input" value={formData.address} onChange={handleChange} placeholder="12 Rue de la République" />
          </div>

          <div className="form-group w-50">
            <label className="form-label">Code Postal *</label>
            <input type="text" name="postalCode" required className="form-input" value={formData.postalCode} onChange={handleChange} placeholder="45500" />
          </div>

          <div className="form-section-title mt-4">
            <h3>Détails des Livres</h3>
          </div>

          <div className="form-row">
            <div className="form-group w-50">
              <label className="form-label">Nombre estimé de livres *</label>
              <div className="select-wrapper">
                <select name="bookCount" className="form-select" value={formData.bookCount} onChange={handleChange}>
                  <option value="10-20">10 – 20 livres</option>
                  <option value="20-50">20 – 50 livres</option>
                  <option value="50-100">50 – 100 livres</option>
                  <option value="100+">100+ livres</option>
                </select>
              </div>
            </div>
            
            <div className="form-group w-50">
              <label className="form-label">Photos (Optionnel)</label>
              <input type="file" multiple accept="image/*" className="form-input file-input" title="Télécharger des photos des lots" />
              <small className="text-muted">Aide à estimer la valeur (max 3 photos)</small>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Disponibilité pour la collecte *</label>
            <div className="select-wrapper">
              <select name="availability" className="form-select" value={formData.availability} onChange={handleChange}>
                <option value="Matin (Semaine)">Matin (Semaine)</option>
                <option value="Après-midi (Semaine)">Après-midi (Semaine)</option>
                <option value="Week-end">Week-end</option>
              </select>
            </div>
          </div>

          <div className="form-agreement mt-4">
            <label className="checkbox-label">
              <input type="checkbox" name="agreement" required checked={formData.agreement} onChange={handleChange} />
              <span className="checkbox-text">Je comprends que mes livres seront évalués et revendus, et que je recevrai <strong>60% du prix de revente</strong> une fois la vente conclue sur les plateformes partenaires.</span>
            </label>
          </div>

          <button type="submit" className="btn btn-primary btn-large w-100 mt-6" disabled={isSubmitting || !formData.agreement}>
            {isSubmitting ? 'Traitement en cours...' : (
              <span className="flex-center">Demander la Collecte <Send size={20} className="ml-2" /></span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
