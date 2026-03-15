import React from 'react';
import { BookPlus, Truck, HandCoins, ArrowRight, ShieldCheck, Box, Recycle, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import './LandingPage.css'; // Will create this next

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* SECTION 1 - HERO */}
      <section className="hero">
        <div className="container hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Transformez vos vieux livres en argent — <span>Sans Bouger de Chez Vous</span>
            </h1>
            <p className="hero-subtitle">
              Ne laissez plus vos livres prendre la poussière. Programmez une collecte gratuite à Gien et nous nous occupons de la revente pour vous.
            </p>
            <div className="hero-actions">
              <Link to="/demander-collecte" className="btn btn-primary btn-large btn-icon">
                Programmer une collecte gratuite <ArrowRight size={20} />
              </Link>
            </div>
            <div className="hero-trust">
              <ShieldCheck size={20} className="accent-icon" />
              <span>Service local de revente de livres à Gien</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="book-stack-mockup">
              &nbsp;
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 - TRUST / LOCAL FOCUS */}
      <section className="section local-focus">
        <div className="container">
          <div className="local-badge">📍 Concentré sur le local</div>
          <h2>Au service exclusif des habitants de Gien et alentours</h2>
          <div className="local-features">
            <div className="local-feature">
              <Truck size={32} className="primary-icon" />
              <p>Nous venons directement à votre domicile</p>
            </div>
            <div className="local-feature">
              <Box size={32} className="primary-icon" />
              <p>Aucun envoi par colis à gérer</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 - HOW IT WORKS */}
      <section className="section how-it-works bg-alt">
        <div className="container">
          <div className="section-header">
            <h2>Comment ça marche</h2>
            <p>Désencombrez en 3 étapes simples</p>
          </div>
          <div className="steps-container">
            <div className="step-card">
              <div className="step-icon">
                <BookPlus size={32} />
              </div>
              <h3>1. Demandez la collecte</h3>
              <p>Remplissez le formulaire rapide avec votre adresse à Gien et le nombre approximatif de livres pour planifier notre passage.</p>
            </div>
            <div className="step-card">
              <div className="step-icon">
                <Truck size={32} />
              </div>
              <h3>2. Nous venons les chercher</h3>
              <p>Nous récupérons les livres directement chez vous. Aucun emballage nécessaire, aucune étiquette d'expédition, aucun tracas de revente.</p>
            </div>
            <div className="step-card">
              <div className="step-icon accent-bg">
                <HandCoins size={32} />
              </div>
              <h3>3. Vous êtes payé</h3>
              <p>Une fois les livres revendus, vous recevez 60% du prix de revente, versé directement sur votre compte bancaire ou via PayPal.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 - BENEFITS */}
      <section className="section benefits">
        <div className="container">
          <div className="section-header">
            <h2>Pourquoi est-ce la meilleure solution ?</h2>
            <p>Le moyen le plus simple de faire de la place</p>
          </div>
          <div className="benefits-grid">
            <div className="card">
              <h4>Zéro Tracas de Vente</h4>
              <p>Pas besoin de prendre des photos, de créer des annonces, ni de négocier avec les acheteurs en ligne.</p>
            </div>
            <div className="card">
              <h4>Aucun Emballage</h4>
              <p>Oubliez la recherche de cartons, le scotch ou les allers-retours à la Poste. On s'occupe de tout.</p>
            </div>
            <div className="card">
              <h4>Collecte Gratuite</h4>
              <p>Nous venons à vous gratuitement pour récupérer votre pile de livres inutilisés.</p>
            </div>
            <div className="card">
              <h4>Plus d'Espace Chez Vous</h4>
              <p>Respirez à nouveau en transformant vos piles encombrantes en de l'espace libre (et de l'argent).</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 - WHAT BOOKS YOU ACCEPT */}
      <section className="section accepted-books bg-alt">
        <div className="container">
          <div className="section-header">
            <h2>Que reprenons-nous ?</h2>
            <p>Afin de garantir un service efficace, voici les critères d'acceptation</p>
          </div>
          <div className="accepted-grid">
            <div className="card accepted-list">
              <h3 className="text-accent">✅ Livres acceptés</h3>
              <ul>
                <li>Romans et littérature</li>
                <li>Essais et non-fiction</li>
                <li>Livres professionnels et universitaires</li>
                <li>Mangas</li>
                <li>Bandes dessinées</li>
              </ul>
            </div>
            <div className="card rejected-list">
              <h3 className="text-danger">❌ Livres refusés</h3>
              <ul>
                <li>Livres très abîmés, déchirés ou moisis</li>
                <li>Magazines et revues</li>
                <li>Encyclopédies anciennes</li>
                <li>Guides de voyage très obsolètes</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 - SOCIAL PROOF & CTA */}
      <section className="section cta-section">
        <div className="container">
          <div className="cta-box">
            <p className="cta-proof">"Déjà en train d'aider des habitants de Gien à vider leurs étagères."</p>
            <h2>Prêt à faire le tri ?</h2>
            <p>La demande de collecte prend moins de 2 minutes.</p>
            <Link to="/demander-collecte" className="btn btn-primary btn-large">
              Programmer une collecte à Gien
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
