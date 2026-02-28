import CirculationStatus from '../components/CirculationStatus';
import './Home.css';

const Home = () => {
  return (
    <div className="home-page">
      <section className="hero-section">
        <h1>Bienvenido al Portal Ciudadano</h1>
        <p>
          Verifica de manera rápida y segura si tu vehículo tiene permitido 
          transitar el día de hoy en la CDMX y el Estado de México.
        </p>
      </section>
      
      <div className="home-widget-container">
        <CirculationStatus />
      </div>
    </div>
  );
};

export default Home;