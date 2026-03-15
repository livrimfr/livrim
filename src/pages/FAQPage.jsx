import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import './FAQPage.css';

const faqs = [
  {
    question: "Quand suis-je payé ?",
    answer: "Vous êtes payé une fois que vos livres ont été vendus à un acheteur final. Les paiements sont généralement traités et envoyés dans les 30 jours suivant notre collecte à votre domicile."
  },
  {
    question: "Que se passe-t-il si certains livres ne se vendent pas ?",
    answer: "Si au bout d'une certaine période (généralement 6 mois) certains livres ne trouvent pas preneur, vous avez deux options : nous pouvons en faire don à des associations caritatives locales, ou nous pouvons vous les retourner (sans frais)."
  },
  {
    question: "Comment déterminez-vous le prix de revente ?",
    answer: "Le prix est déterminé dynamiquement en fonction de la demande du marché actuel, de l'état général du livre (usure, annotations), et de l'édition spécifique de l'ouvrage (éditions rares, récentes, etc.). Nous utilisons des outils d'estimation professionnels pour vous garantir le meilleur prix."
  },
  {
    question: "Les collectes ont-elles un coût ?",
    answer: "Non, la collecte à domicile est entièrement gratuite pour les habitants de Gien et des proches alentours. Nous prenons en charge les frais de déplacement."
  },
  {
    question: "Combien de livres minimum dois-je avoir pour une collecte ?",
    answer: "Pour que notre déplacement soit écologique et économiquement viable, nous demandons un minimum de 20 livres par collecte. Si vous en avez un peu moins mais qu'il s'agit de livres de grande valeur (comme des manuels universitaires récents), n'hésitez pas à nous contacter."
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="faq-page">
      <div className="page-header">
        <div className="container">
          <h1>Foire Aux Questions</h1>
          <p>Toutes les réponses à vos questions concernant notre service.</p>
        </div>
      </div>
      
      <div className="container section">
        <div className="faq-container">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`faq-item card ${openIndex === index ? 'active' : ''}`}
            >
              <button 
                className="faq-question" 
                onClick={() => toggleFaq(index)}
              >
                <span>{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="primary-icon" />
                ) : (
                  <ChevronDown className="text-muted" />
                )}
              </button>
              <div 
                className="faq-answer"
                style={{ 
                  maxHeight: openIndex === index ? '300px' : '0',
                  paddingTop: openIndex === index ? '1rem' : '0',
                  opacity: openIndex === index ? 1 : 0
                }}
              >
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="faq-contact">
          <p>Vous avez d'autres questions ?</p>
          <a href="mailto:contact@giendebarraslivres.fr" className="btn btn-primary">
            Contactez-nous
          </a>
        </div>
      </div>
    </div>
  );
}
