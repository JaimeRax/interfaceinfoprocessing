import React, { useEffect } from "react";
import { useRouter } from "next/router";

function index() {
  const router = useRouter();

  useEffect(() => {
    // Redirige al usuario a la página de inicio de sesión
    router.push("/login");
  }, [router]);

  return (
    <div>
      <h1>Redirigiendo...</h1>
    </div>
  );
}

export default index;
