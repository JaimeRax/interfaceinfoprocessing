import React from "react";
import Navbar from "../pages/components/Navbar";
import styles from "../styles/Home.module.css";

const Home = () => {
  return (
    <div className={styles.container}>
      <Navbar />
      <div className={styles.welcome}>
        <h1>Bienvenido a extractData</h1>
        <p>
          Optimiza la extracción de texto e imágenes con nuestro sistema
          avanzado.
        </p>
      </div>
      <div className={styles.actions}></div>
    </div>
  );
};

export default Home;
