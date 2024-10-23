import React, { useState } from "react";
import { useRouter } from "next/router";
import Swal from "sweetalert2";
import styles from "../styles/Login.module.css";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(""); // Resetea el error
    setSuccess(""); // Resetea el éxito

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL_LOGIN}/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        },
      );

      const data = await res.json();
      if (res.status === 201) {
        Swal.fire({
          icon: "success",
          title: "Usuario registrado exitosamente",
          showConfirmButton: false,
          timer: 2000, // Mostrar durante 3 segundos
        }).then(() => {
          // Redirigir al login después de que SweetAlert se cierre
          router.push("/login");
        });
      } else {
        setError(data.error || "Error en el registro");

        Swal.fire({
          icon: "error",
          title: "Ocurrio un error al registrar al usuario.",
          showConfirmButton: false,
          timer: 2000,
        }).then(() => {
          router.push("/register");
        });
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

export default Register;
