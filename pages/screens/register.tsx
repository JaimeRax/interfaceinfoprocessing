import React, { useState } from "react";
import { useRouter } from "next/router";
// import styles from "../styles/login.css";

function register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8080/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.status === 201) {
        setSuccess("Usuario registrado exitosamente");
        // Redirigir al login después del registro exitoso
        router.push("/");
      } else {
        setError(data.error || "Error en el registro");
      }
    } catch (err) {
      setError("Error al conectar con el servidor");
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Registrarse</h1>
      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}
      <form onSubmit={handleRegister} className={styles.form}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.input}
          required
        />
        <button type="submit" className={styles.button}>
          Registrarse
        </button>
      </form>
      <div className={styles.register}>
        <p>¿Ya tienes cuenta?</p>
        <button
          onClick={() => router.push("/")}
          className={styles.registerButton}
        >
          Iniciar Sesión
        </button>
      </div>
    </div>
  );
}

export default register;
