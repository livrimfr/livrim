import React from 'react';
import { MousePointerClick, Truck, Store, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import './HowItWorksPage.css';

export default function HowItWorksPage() {
  return (
    <div className="how-it-works-page">
      <div className="page-header">
        <div className="container">
          <h1>Comment ça marche</h1>
          <p>Un processus transparent et sans effort, de votre étagère à votre compte en banque.</p>
        </div>
      </div>
      
      <div className="container section">
        <div className="process-timeline">
          {/* Step 1 */}
          <div className="timeline-step">
            <div className="step-number">1</div>
            <div className="step-content card">
              <div className="step-icon-wrapper">
                <MousePointerClick size={32} className="primary-icon" />
              </div>
              <h2>Demander une collecte</h2>
              <p>
                Remplissez notre court formulaire en ligne pour indiquer votre adresse à Gien et 
                le nombre approximatif de livres que vous souhaitez vendre.
              </p>
              <p className="text-muted">
                Nous vous contactons ensuite rapidement pour confirmer la date et l'heure de la collecte 
                qui vous conviennent.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="timeline-step">
            <div className="step-number">2</div>
            <div className="step-content card">
              <div className="step-icon-wrapper">
                <Truck size={32} className="primary-icon" />
              </div>
              <h2>Collecte à domicile</h2>
              <p>
                Nous venons chez vous et récupérons les livres. Pas besoin de les emballer, 
                pas d'étiquettes d'expédition, pas de cartons.
              </p>
              <p className="text-muted">
                Notre équipe évalue rapidement l'état des livres lors de la collecte pour 
                s'assurer qu'ils correspondent à nos critères.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="timeline-step">
            <div className="step-number">3</div>
            <div className="step-content card">
              <div className="step-icon-wrapper">
                <Store size={32} className="primary-icon" />
              </div>
              <h2>Tri et Revente</h2>
              <p>
                Nous nous occupons de tout le reste. Nous trions vos livres et les mettons en vente 
                sur plusieurs plateformes, telles que les marketplaces de seconde main et les acheteurs de livres en ligne.
              </p>
              <p className="text-muted">
                Nous gérons les annonces, les photos de présentation, les négociations et les expéditions aux acheteurs finaux.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="timeline-step">
            <div className="step-number">4</div>
            <div className="step-content card">
              <div className="step-icon-wrapper accent-bg">
                <CreditCard size={32} />
              </div>
              <h2>Paiement</h2>
              <p>
                Dès que vos livres sont vendus, vous recevez <strong>60% du prix de revente final</strong>.
              </p>
              <p className="text-muted">
                Les paiements sont généralement traités dans les 30 jours suivant la collecte. 
                Vous pouvez choisir d'être payé par virement bancaire ou PayPal.
              </p>
            </div>
          </div>
        </div>

        <div className="process-cta">
          <h2>Prêt à commencer ?</h2>
          <Link to="/demander-collecte" className="btn btn-primary btn-large">
            Demander une collecte maintenant
          </Link>
        </div>
      </div>
    </div>
  );
}
