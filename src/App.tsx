import React, { useState } from 'react';
import Home from './pages/Home';
import SalesForm from './pages/SalesForm';
import SalesForm2 from './pages/SalesForm2';
import ListadeVentas from './pages/ListadeVentas';
import ProductManagement from './pages/ProductManagement';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('home');

  const navigateToSalesForm = () => setCurrentView('salesForm');
  const navigateToSalesForm2 = () => setCurrentView('salesForm2');
  const navigateToListadeVentas = () => setCurrentView('ListadeVentas');
  const navigateToProductManagement = () => setCurrentView('productManagement');
  const navigateToHome = () => setCurrentView('home');

  return (
    <div>
      {currentView === 'home' && (
        <Home 
          onNavigateToSalesForm={navigateToSalesForm}
          onNavigateToSalesForm2={navigateToSalesForm2}
          onNavigateToListadeVentas={navigateToListadeVentas}
          onNavigateToProductManagement={navigateToProductManagement}
        />
      )}
      {currentView === 'salesForm' && (
        <SalesForm onBack={navigateToHome} />
      )}
      {currentView === 'salesForm2' && (
        <SalesForm2 onBack={navigateToHome} />
      )}
      {currentView === 'ListadeVentas' && (
        <ListadeVentas onBack={navigateToHome} />
      )}
      {currentView === 'productManagement' && (
        <ProductManagement onBack={navigateToHome} />
      )}
    </div>
  );
};

export default App;
