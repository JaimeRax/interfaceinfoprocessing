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
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [drawingEnabled, setDrawingEnabled] = useState<boolean>(false);
  const [zipDownloadLink, setZipDownloadLink] = useState<string | null>(null); // Para el ZIP

  // Función para cargar la imagen
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        setImage(img);
        setImageFile(file);
        const canvas = canvasRef.current;
        if (canvas) {
          // Ajusta el tamaño del canvas según la imagen cargada
          canvas.width = img.width;
          canvas.height = img.height;
          const context = canvas.getContext("2d");
          if (context) {
            // Dibuja la imagen cargada en el canvas
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, 0, 0, canvas.width, canvas.height);
          }
        }
      };
    }
  };

  // Función para manejar el clic en el canvas
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingEnabled || !image) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    // Ajustar las coordenadas del clic según el tamaño del canvas e imagen
    const scaleX = canvas.width / image.width;
    const scaleY = canvas.height / image.height;

    const x = Math.round((event.clientX - rect.left) / scaleX);
    const y = Math.round((event.clientY - rect.top) / scaleY);

    const newCoords = [...currentCoords, { x, y }];
    setCurrentCoords(newCoords);

    if (newCoords.length === 2) {
      drawRectangle(newCoords[0], { x, y });
      promptForAnnotation(newCoords[0].x, newCoords[0].y, x, y);
      setCurrentCoords([]); // Resetea las coordenadas después de cada anotación
    }
  };

  // Función para dibujar un rectángulo en el canvas
  const drawRectangle = (
    start: { x: number; y: number },
    end: { x: number; y: number },
  ) => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const context = canvas.getContext("2d");
    if (context) {
      const width = end.x - start.x;
      const height = end.y - start.y;

      // Limpiar el canvas y redibujar la imagen para evitar que los rectángulos previos se queden
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      // Dibujar el rectángulo
      context.fillStyle = "rgba(173, 216, 230, 0.5)"; // Color semitransparente
      context.fillRect(start.x, start.y, width, height);
      context.strokeStyle = "#00BFFF"; // Borde del rectángulo
      context.lineWidth = 2;
      context.strokeRect(start.x, start.y, width, height);
    }
  };

  // Función para mostrar un popup y solicitar la etiqueta de anotación
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
      }
    });
  };

  // Función para enviar las anotaciones a la API
  const sendAnnotationsToAPI = async () => {
    if (!imageFile) {
      console.error("No image file available to send.");
      return;
    }

    const formData = new FormData();
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
        const blob = await response.blob();
        const zipUrl = URL.createObjectURL(blob);
        setZipDownloadLink(zipUrl); // Configuramos el enlace para descargar el ZIP
      } else {
        console.error("Error en la respuesta de la API", response.statusText);
      }
    } catch (error) {
      console.error("Error al enviar los datos a la API", error);
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
    setZipDownloadLink(null); // Limpia el enlace del ZIP
  };

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
              <li>
                4) Haz clic en "Enviar" cuando hayas terminado para enviar todas
                las anotaciones a la API.
              </li>
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
              className={styles.actionButton}
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

        {/* Columna derecha para el enlace de descarga ZIP */}
        <div className={styles.rightColumn}>
          <h2>Resultados</h2>
          {zipDownloadLink && (
            <div className={styles.downloadContainer}>
              <a href={zipDownloadLink} download="resultados.zip">
                <i className="fas fa-download"></i> Descargar Resultados (.zip)
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ExtactSingle;
