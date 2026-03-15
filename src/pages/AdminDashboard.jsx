import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, BookOpen, Euro, Trash2, ArrowRight, Lock, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import './AdminDashboard.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix typical Leaflet missing icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const API_URL = 'http://localhost:3000/api/requests';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [requests, setRequests] = useState([]);
  
  // Helper to estimate book value from quantity bracket
  const estimateValue = (bookCount) => {
    if (bookCount === '10-20')  return 15 * 3;   // ~15 books × 3€ avg
    if (bookCount === '20-50')  return 35 * 3;
    if (bookCount === '50-100') return 75 * 3;
    return 120 * 3;                              // 100+
  };

  // Use real salePrice data from !livres command where available, else estimate
  const soldRequests = requests.filter(r => r.status === 'Books Sold' || r.status === 'Payment Sent');
  const realSales = soldRequests.reduce((acc, r) => acc + (r.salePrice || estimateValue(r.bookCount)), 0);
  const realProfit = soldRequests.reduce((acc, r) => acc + (r.profit || estimateValue(r.bookCount) * 0.4), 0);
  const realOwed = soldRequests.reduce((acc, r) => acc + (r.sellerPayout || estimateValue(r.bookCount) * 0.6), 0);
  const stats = {
    totalRequests: requests.length,
    pendingPickups: requests.filter(r => r.status === 'Pending' || r.status === 'Pickup Scheduled').length,
    booksCollected: requests.reduce((acc, req) => {
      if (req.actualBookCount) return acc + req.actualBookCount;
      if(req.bookCount === '10-20') return acc + 15;
      if(req.bookCount === '20-50') return acc + 35;
      if(req.bookCount === '50-100') return acc + 75;
      return acc + 120;
    }, 0),
    totalSales: realSales,
    profit: realProfit,
    owedToSellers: realOwed
  };

  const fetchRequests = async () => {
    try {
      const resp = await fetch(API_URL);
      if(resp.ok) {
        setRequests(await resp.json());
      }
    } catch(err) {
      console.error("Error fetching requests, is backend running?", err);
    }
  };

  useEffect(() => {
    // Auto-auth via URL token (from Discord dashboard link)
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token === 'discord-admin-access-2024') {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
      return;
    }
    if (sessionStorage.getItem('admin_authenticated') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Poll database when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchRequests();
      const interval = setInterval(fetchRequests, 5000); // refresh every 5s
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'adminb00ks') {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
      setError('');
    } else {
      setError('Mot de passe incorrect');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
  };

  const notifyDiscord = async (message, color) => {
    const webhookUrl = 'https://discord.com/api/webhooks/1482455279659389070/oM4ek52Ip6lTrG2Tb9OsLuawTtwJtf5Ej1YeLdNReQOqm2-4eiS01bu7dwgGNaSQt9ky';
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: "⚙️ Mise à jour d'une demande",
            description: message,
            color: color || 3447003,
            timestamp: new Date().toISOString()
          }]
        })
      });
    } catch(err) {
      console.error(err);
    }
  };

  const cycleStatus = async (id, currentStatus, name) => {
    const statusFlow = {
      'Pending': 'Pickup Scheduled',
      'Pickup Scheduled': 'Books Collected',
      'Books Collected': 'Books Sold',
      'Books Sold': 'Payment Sent',
      'Payment Sent': 'Pending'
    };
    const nextStatus = statusFlow[currentStatus] || 'Pending';
    
    try {
      const resp = await fetch(`${API_URL}/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if(resp.ok) {
        notifyDiscord(`Le statut de la demande de **${name}** est passé de \`${currentStatus}\` à \`${nextStatus}\`.`, 3447003);
        fetchRequests(); // refresh local model
      }
    } catch(err) {
      console.error("Failed to update status", err);
    }
  };
  
  const deleteRequest = async (id, name) => {
    try {
      const resp = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if(resp.ok) {
        notifyDiscord(`La demande de **${name}** a été **supprimée**.`, 15158332);
        fetchRequests();
      }
    } catch(err) {
      console.error("Failed to delete", err);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'Pending': return 'badge-pending';
      case 'Pickup Scheduled': return 'badge-scheduled';
      case 'Books Collected': return 'badge-collected';
      case 'Books Sold': return 'badge-sold';
      case 'Payment Sent': return 'badge-paid';
      default: return 'badge-neutral';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login-container">
        <div className="card admin-login-card">
          <div className="login-icon-wrapper">
            <Lock size={48} className="primary-icon" />
          </div>
          <h2>Accès Administrateur</h2>
          <p className="text-muted mb-4">Veuillez entrer le mot de passe</p>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <input type="password" className="form-input" placeholder="Mot de passe..." value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
            </div>
            {error && <p className="text-danger" style={{fontSize: '0.875rem', marginTop: '-0.5rem', marginBottom: '1rem'}}>{error}</p>}
            <button type="submit" className="btn btn-primary w-100">Se connecter</button>
          </form>
        </div>
      </div>
    );
  }

  // Calculate Map center (default Gien center)
  const gienCenter = [47.6938, 2.6333];
  
  // Filter out those with lat/lng
  const mappableRequests = requests.filter(r => r.lat && r.lng && r.status !== 'Payment Sent');

  return (
    <div className="admin-page container section">
      <div className="admin-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <h1 style={{margin: 0}}><LayoutDashboard className="primary-icon mr-2" /> Panneau d'Administration</h1>
          <p className="text-muted" style={{marginTop: '0.5rem'}}>Gérez les collectes, consultez la carte et suivez les versements.</p>
        </div>
        <button className="btn" style={{backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444'}} onClick={handleLogout}>
          Déconnexion
        </button>
      </div>

      <div className="admin-stats-grid">
        <div className="card stat-card">
          <div className="stat-icon bg-blue"><Users size={24}/></div>
          <div className="stat-content">
            <p>Demandes totales</p>
            <h3>{stats.totalRequests}</h3>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon bg-orange"><MapPin size={24}/></div>
          <div className="stat-content">
            <p>Collectes à faire</p>
            <h3>{stats.pendingPickups}</h3>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon bg-purple"><BookOpen size={24}/></div>
          <div className="stat-content">
            <p>Livres estimés</p>
            <h3>~{stats.booksCollected}</h3>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon bg-green"><Euro size={24}/></div>
          <div className="stat-content">
            <p>Ventes réalisées</p>
            <h3>{stats.totalSales.toFixed(2)} €</h3>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{background:'rgba(34,197,94,0.15)',color:'#22c55e'}}><Euro size={24}/></div>
          <div className="stat-content">
            <p>Bénéfice (40%)</p>
            <h3 style={{color:'#22c55e'}}>{stats.profit.toFixed(2)} €</h3>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444'}}><Euro size={24}/></div>
          <div className="stat-content">
            <p>Dû aux vendeurs (60%)</p>
            <h3 style={{color: '#ef4444'}}>{stats.owedToSellers.toFixed(2)} €</h3>
          </div>
        </div>
      </div>

      <div className="card admin-map-container mb-4">
        <h3 className="table-title mb-4">Carte des Collectes (Gien)</h3>
        <div style={{ height: '400px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          <MapContainer center={gienCenter} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {mappableRequests.map(req => {
              const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${req.address}, ${req.postalCode} Gien, France`)}`;
              return (
                <Marker key={req.id} position={[req.lat, req.lng]}>
                  <Popup>
                    <div style={{minWidth: '180px'}}>
                      <strong style={{fontSize: '1rem'}}>{req.name}</strong>
                      <p style={{margin: '4px 0'}}>{req.address}<br/>📦 {req.bookCount} livres<br/>🕒 {req.availability}</p>
                      <span className={`badge ${getStatusBadgeClass(req.status)}`} style={{display:'block', marginBottom:'8px'}}>{req.status}</span>
                      <a
                        href={gmapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{display:'block', textAlign:'center', padding:'6px 12px', background:'#6366f1', color:'white', borderRadius:'8px', textDecoration:'none', fontWeight:'600', fontSize:'0.85rem'}}
                      >
                        🗺️ Itinéraire Google Maps
                      </a>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      <div className="card admin-table-container">
        <h3 className="table-title">Demandes de Collecte</h3>
        {requests.length === 0 ? (
          <div className="empty-state text-muted text-center p-4">
            <p>Aucune demande dans la base de données. Allez sur la page "Demander une collecte" pour en créer une !</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Vendeur</th>
                  <th>Lieu & Date</th>
                  <th>Livres</th>
                  <th>Statut</th>
                  <th>Finances</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <strong>{req.name}</strong>
                      <div className="text-small text-muted">{req.phone}</div>
                    </td>
                    <td>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${req.address}, ${req.postalCode} Gien, France`)}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{color: 'var(--primary-color)', fontWeight: 500}}
                      >
                        🗺️ {req.address}
                      </a>
                      <div className="text-small text-muted">{new Date(req.date).toLocaleDateString()} - {req.availability}</div>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{req.actualBookCount ? `${req.actualBookCount} réels` : req.bookCount}</span>
                    </td>
                    <td style={{fontSize: '0.8rem'}}>
                      {req.salePrice ? (
                        <><div>💰 {req.salePrice}€ vente</div><div style={{color:'#22c55e'}}>✅ {req.profit}€ bénéfice</div></>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(req.status)}`}>
                        {req.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-action btn-update"
                          onClick={() => cycleStatus(req.id, req.status, req.name)}
                          title="Avancer le statut"
                        >
                          <ArrowRight size={16} />
                        </button>
                        <button 
                          className="btn-action btn-delete"
                          onClick={() => deleteRequest(req.id, req.name)}
                          title="Supprimer la demande"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
