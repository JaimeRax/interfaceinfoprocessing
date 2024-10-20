import React from "react";
import { useRouter } from "next/router";
import styles from "../../styles/Navbar.module.css";

const Navbar = () => {
  const router = useRouter();

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo} onClick={() => router.push("/home")}>
        extract<strong>Data</strong>
      </div>
      <ul className={styles.menu}>
        <li
          className={styles.menuItem}
          onClick={() => router.push("/screens/extractSingle")}
        >
          Extracción Simple
        </li>
        <li className={styles.menuItem} onClick={() => router.push("/menu2")}>
          Menu 2
        </li>
        <li className={styles.menuItem} onClick={() => router.push("/login")}>
          Logout
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
