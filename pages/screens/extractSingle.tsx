import React from "react";
import Navbar from "../components/Navbar";
import styles from "../../styles/Home.module.css";

const ExtactSingle = () => {
  return (
    <div className={styles.container}>
      <Navbar />
      <div className={styles.welcome}>
        <h1>extractData Single</h1>
      </div>
      <div className={styles.actions}></div>
    </div>
  );
};

export default ExtactSingle;
