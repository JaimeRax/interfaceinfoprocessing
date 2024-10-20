import React from "react";
import { useRouter } from "next/router";
import styles from "../styles/Home.module.css";

const Home = () => {
  const router = useRouter();

  const handleUpload = () => {
    router.push("/home");
  };

  const handleTemplates = () => {
    router.push("/home");
  };

  const handleReports = () => {
    router.push("/home");
  };

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <div className={styles.logo}>extractData</div>
        <ul className={styles.menu}>
          <li className={styles.menuItem}>Menu 1</li>
          <li className={styles.menuItem}>Menu 2</li>
          <li className={styles.menuItem} onClick={() => router.push("/login")}>
            Logout
          </li>
        </ul>
      </nav>

      <div className={styles.welcome}>
        <h1>Bienvenido a extractData</h1>
        <p>
          Optimiza la extracción de texto e imágenes con nuestro sistema
          avanzado.
        </p>
      </div>

      <div className={styles.actions}>
        <button onClick={handleUpload} className={styles.button}>
          Subir Documentos
        </button>
        <button onClick={handleTemplates} className={styles.button}>
          Gestionar Plantillas
        </button>
        <button onClick={handleReports} className={styles.button}>
          Ver Reportes
        </button>
      </div>

      <div className={styles.stats}>
        <h3>Estadísticas recientes:</h3>
        <p>Documentos procesados esta semana: 10</p>
        <p>Plantillas activas: 5</p>
        <p>Extracciones exitosas: 98%</p>
      </div>
    </div>
  );
};

export default Home;
