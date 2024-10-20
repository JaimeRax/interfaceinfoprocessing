import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";

function index() {
  const router = useRouter();

  useEffect(() => {
    // Redirige al usuario a la página de inicio de sesión
    router.push("/screens/register");
  }, [router]);

  return (
    <div>
      <h1>Redirigiendo...</h1>
    </div>
  );
}
//   const [message, setMessage] = useState("loading");
//   useEffect(() => {
//     fetch("http://localhost:5001/")
//       .then((response) => response.json())
//       .then((data) => {
//         setMessage(data.message);
//       });
//   }, []);
//
//   return <div>{message}</div>;
// }

export default index;
