import React, { useState } from 'react';
import Home from './pages/Home';
import SalesForm from './pages/SalesForm';
import SalesForm2 from './pages/SalesForm2';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('home');

  const navigateToSalesForm = () => setCurrentView('salesForm');
  const navigateToSalesForm2 = () => setCurrentView('salesForm2');
  const navigateToHome = () => setCurrentView('home');

  return (
    <div>
      {currentView === 'home' && (
        <Home 
          onNavigateToSalesForm={navigateToSalesForm}
          onNavigateToSalesForm2={navigateToSalesForm2}
        />
      )}
      {currentView === 'salesForm' && (
        <SalesForm onBack={navigateToHome} />
      )}
      {currentView === 'salesForm2' && (
        <SalesForm2 onBack={navigateToHome} />
      )}
    </div>
  );
};

export default App;
