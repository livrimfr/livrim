import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import './App.css';

// Pages placeholders
import LandingPage from './pages/LandingPage';
import HowItWorksPage from './pages/HowItWorksPage';
import PickupRequestPage from './pages/PickupRequestPage';
import FAQPage from './pages/FAQPage';
import AdminDashboard from './pages/AdminDashboard';
import OrderTrackingPage from './pages/OrderTrackingPage';

function Navigation() {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path ? 'nav-link active' : 'nav-link';
  };

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-brand">
          <BookOpen color="var(--primary-color)" size={28} />
          Gien <span>Débarras Livres</span>
        </Link>
        <div className="nav-links">
          <Link to="/" className={isActive('/')}>Accueil</Link>
          <Link to="/comment-ca-marche" className={isActive('/comment-ca-marche')}>Comment ça marche</Link>
          <Link to="/suivi" className={isActive('/suivi')}>Suivi Commande</Link>
          <Link to="/faq" className={isActive('/faq')}>FAQ</Link>
          <Link to="/demander-collecte" className="btn btn-primary">Demander une collecte</Link>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-nav">
          <div className="footer-brand">
            <h3><BookOpen color="var(--primary-color)" size={24} /> Gien Débarras Livres</h3>
            <p>Le moyen le plus simple de désencombrer votre maison. Nous collectons vos livres à Gien et les revendons pour vous.</p>
          </div>
          <div className="footer-links">
            <h4>Liens utiles</h4>
            <ul>
              <li><Link to="/comment-ca-marche">Comment ça marche</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
              <li><Link to="/demander-collecte">Demander une collecte</Link></li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>Contact</h4>
            <ul>
              <li><a href="mailto:contact@giendebarraslivres.fr">contact@giendebarraslivres.fr</a></li>
              <li>Secteur de collecte : Gien et alentours (15km)</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; {new Date().getFullYear()} Gien Débarras Livres. Tous droits réservés. <Link to="/admin" style={{color: 'transparent'}}>Admin</Link>
        </div>
      </div>
    </footer>
  );
}

function App() {
  return (
    <Router>
      <div className="app-wrapper">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/comment-ca-marche" element={<HowItWorksPage />} />
            <Route path="/demander-collecte" element={<PickupRequestPage />} />
            <Route path="/suivi" element={<OrderTrackingPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
