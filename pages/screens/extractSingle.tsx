import React, { useRef, useState } from "react";
import Swal from "sweetalert2";
import styles from "../../styles/extractSingle.module.css";
import Navbar from "../components/Navbar";

const ExtactSingle = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentCoords, setCurrentCoords] = useState<
    { x: number; y: number }[]
  >([]);
  const [annotations, setAnnotations] = useState<any[]>([]); // Almacena todas las anotaciones
  const [apiResult, setApiResult] = useState<string | null>(null);
  const [drawingEnabled, setDrawingEnabled] = useState<boolean>(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        setImage(img);
        setImageFile(file); // Guarda el archivo de la imagen para enviarlo más tarde
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = 800; // Fijo el ancho del canvas
          canvas.height = (800 * img.height) / img.width; // Mantener la proporción de la imagen
        }
      };
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingEnabled) return;

    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const rect = canvas.getBoundingClientRect();

    // Ajuste de coordenadas
    const scaleX = canvas.width / image.width;
    const scaleY = canvas.height / image.height;

    const x = Math.round(
      (event.clientX - rect.left) * (image.width / canvas.width),
    );
    const y = Math.round(
      (event.clientY - rect.top) * (image.height / canvas.height),
    );

    const newCoords = [...currentCoords, { x, y }];
    setCurrentCoords(newCoords);

    if (newCoords.length === 2) {
      drawRectangle(newCoords[0], { x, y });
      promptForAnnotation(newCoords[0].x, newCoords[0].y, x, y);
    }
  };

  const drawRectangle = (
    start: { x: number; y: number },
    end: { x: number; y: number },
  ) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (context && image) {
      const width = end.x - start.x;
      const height = end.y - start.y;

      context.clearRect(0, 0, canvas.width, canvas.height); // Limpia el canvas antes de dibujar
      context.drawImage(image, 0, 0, canvas.width, canvas.height); // Redibuja la imagen

      context.fillStyle = "rgba(173, 216, 230, 0.5)";
      context.fillRect(
        start.x * (canvas.width / image.width),
        start.y * (canvas.height / image.height),
        width * (canvas.width / image.width),
        height * (canvas.height / image.height),
      );

      context.strokeStyle = "#00BFFF";
      context.lineWidth = 2;
      context.strokeRect(
        start.x * (canvas.width / image.width),
        start.y * (canvas.height / image.height),
        width * (canvas.width / image.width),
        height * (canvas.height / image.height),
      );
    }
  };

  const promptForAnnotation = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ) => {
    Swal.fire({
      title: "Etiqueta los puntos",
      html: `
        <label for="label">Etiqueta:</label>
        <select id="label" class="swal2-input">
          <option value="text">text</option>
          <option value="img">img</option>
        </select>
        <br>
        <label for="name">Nombre:</label>
        <input id="name" class="swal2-input">
      `,
      preConfirm: () => {
        const label = (document.getElementById("label") as HTMLSelectElement)
          .value;
        const name = (document.getElementById("name") as HTMLInputElement)
          .value;
        return { label, name };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const newAnnotation = [
          [x1, y1],
          [x2, y2],
          result.value.label,
          result.value.name,
        ];
        setAnnotations((prev) => [...prev, newAnnotation]);
        setCurrentCoords([]); // Resetea las coordenadas después de cada anotación
      }
    });
  };

  const sendAnnotationsToAPI = async () => {
    if (!imageFile) {
      console.error("No image file available to send.");
      return;
    }

    const formData = new FormData();

    // Agrega la imagen y las anotaciones al FormData
    formData.append("template_image", imageFile);
    formData.append("roi_array", JSON.stringify(annotations));

    try {
      const response = await fetch(
        "http://127.0.0.1:5001/api/lectorDPI/extract_single",
        {
          method: "POST",
          body: formData,
        },
      );

      if (response.ok) {
        const result = await response.json();
        setApiResult(JSON.stringify(result, null, 2)); // Mostrar resultado de la API
      } else {
        console.error("Error en la respuesta de la API", response.statusText);
        setApiResult("Error en la respuesta de la API");
      }
    } catch (error) {
      console.error("Error al enviar los datos a la API", error);
      setApiResult("Error al enviar los datos a la API");
    }
  };

  const handleDibujarClick = () => {
    setDrawingEnabled(true); // Activa el modo de dibujo
    document.body.style.cursor = "crosshair"; // Cambia el cursor a "lápiz"
  };

  const handleRemoveLastAnnotation = () => {
    setAnnotations((prev) => {
      const newAnnotations = prev.slice(0, -1);
      return newAnnotations;
    });
  };

  const handleRemoveAllAnnotations = () => {
    setAnnotations([]);
    setDrawingEnabled(false); // Desactiva el modo de dibujo
    document.body.style.cursor = "default"; // Restablece el cursor
    setApiResult(null); // Limpia el resultado de la API
  };

  // Dibuja en el canvas cuando hay cambios en la imagen o las anotaciones
  React.useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (context && image) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height); // Mantener el tamaño fijo de la imagen

      // Redibuja todas las anotaciones previas
      annotations.forEach((annotation) => {
        const [[x1, y1], [x2, y2]] = annotation;
        drawRectangle({ x: x1, y: y1 }, { x: x2, y: y2 });
      });
    }
  }, [image, annotations]);

  return (
    <>
      <Navbar />
      <div className={styles.mainContainer}>
        <div className={styles.leftColumn}>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className={styles.fileInput}
          />
          <div className={styles.instructions}>
            <h3>
              <strong>Instrucciones</strong>
            </h3>
            <ol>
              <li>
                1) Haz clic en "Dibujar" para habilitar el modo de dibujo.
              </li>
              <li>
                2) Haz clic en la imagen para marcar el primer punto (esquina
                superior izquierda) y el segundo punto (esquina inferior
                derecha).
              </li>
              <li>
                3) Selecciona una etiqueta ("text" o "img") y asigna un nombre a
                cada área seleccionada.
              </li>
              <li>4) Haz clic en "Enviar" cuando hayas terminado.</li>
            </ol>
          </div>
          <div className={styles.buttonContainer}>
            <button
              onClick={handleDibujarClick}
              className={styles.dibujarButton}
              disabled={drawingEnabled}
            >
              Dibujar
            </button>
            <button
              onClick={handleRemoveLastAnnotation}
              className={styles.actionButton}
            >
              Eliminar Etiqueta
            </button>
            <button
              onClick={handleRemoveAllAnnotations}
              className={styles.cancelButton}
            >
              Cancelar
            </button>
            <button
              onClick={sendAnnotationsToAPI}
              className={styles.sendButton}
              disabled={annotations.length === 0} // Desactivar si no hay anotaciones
            >
              Enviar
            </button>
          </div>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            onClick={handleCanvasClick}
          ></canvas>
        </div>

        {/* Columna derecha para mostrar el resultado de la API */}
        <div className={styles.rightColumn}>
          <h2>Resultado de la API</h2>
          <pre>{apiResult || "No se ha enviado ninguna solicitud aún."}</pre>
        </div>
      </div>
    </>
  );
};

export default ExtactSingle;
