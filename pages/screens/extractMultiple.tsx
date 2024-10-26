import React, { useRef, useState } from "react";
import Swal from "sweetalert2";
import styles from "../../styles/extractSingle.module.css";
import Navbar from "../components/Navbar";
import axios from "axios";

const ExtractMultiple = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null); // Estado para el archivo zip
  const [currentCoords, setCurrentCoords] = useState<
    { x: number; y: number }[]
  >([]);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [drawingEnabled, setDrawingEnabled] = useState<boolean>(false);
  const [zipDownloadLink, setZipDownloadLink] = useState<string | null>(null);
  const [labelList, setLabelList] = useState<any[]>([]); // Para la lista de etiquetas
  const [buttonsEnabled, setButtonsEnabled] = useState({
    draw: false,
    cancel: false,
    remove: false,
    send: false,
  }); // Manejo del estado de los botones

  const [isLoading, setIsLoading] = useState<boolean>(false); // Estado para el modal de carga
  const [showNewExtraction, setShowNewExtraction] = useState<boolean>(false); // Controla la visibilidad del botón de "Nueva Extracción"

  // Función para cargar la imagen y habilitar el botón de dibujar
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        setImage(img);
        setImageFile(file);
        setButtonsEnabled({ ...buttonsEnabled, draw: true }); // Habilita el botón dibujar
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
        setLabelList((prev) => [
          ...prev,
          { label: result.value.label, name: result.value.name },
        ]); // Agrega a la lista de etiquetas
      }
    });
  };

  // Función para cargar el archivo zip
  const handleZipUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith(".zip")) {
      setZipFile(file); // Solo permitir archivos .zip
    } else {
      Swal.fire(
        "Error",
        "Por favor selecciona un archivo .zip válido",
        "error",
      );
      event.target.value = ""; // Limpiar el input si no es un .zip
    }
  };

  // Función para enviar las anotaciones a la API (imagen y zip)
  const sendAnnotationsToAPI = async () => {
    if (!imageFile || !zipFile) {
      console.error("No image or zip file available to send.");
      return;
    }

    setIsLoading(true); // Mostrar modal de carga
    const formData = new FormData();
    formData.append("template_image", imageFile);
    formData.append("roi_array", JSON.stringify(annotations));
    formData.append("zip_file", zipFile); // Enviar el archivo zip

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL_LECTOR}/extract_multiple`;

      console.info("UR: ", apiUrl);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL_LECTOR}/extract_multiple`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data", // Asegúrate de establecer el tipo de contenido
          },
          responseType: "blob", // Asegura que la respuesta sea tratada como un blob
        },
      );

      // Crear un objeto URL para el archivo blob recibido
      const zipUrl = URL.createObjectURL(response.data);
      setZipDownloadLink(zipUrl); // Configuramos el enlace para descargar el ZIP
      document.body.style.cursor = "default"; // Devuelve el cursor a normal
      setIsLoading(false);
      setShowNewExtraction(true); // Mostrar botón de Nueva Extracción
    } catch (error) {
      console.error("Error al enviar los datos a la API", error);
      setIsLoading(false);
    }
  };
  const handleDibujarClick = () => {
    setDrawingEnabled(true); // Activa el modo de dibujo
    setButtonsEnabled({ draw: false, cancel: true, remove: true, send: true }); // Habilita los botones y desactiva dibujar
    document.body.style.cursor = "crosshair"; // Cambia el cursor a "lápiz"
  };

  const handleRemoveLastAnnotation = () => {
    setAnnotations((prev) => {
      const newAnnotations = prev.slice(0, -1);
      setLabelList((prev) => prev.slice(0, -1)); // Actualiza la lista de etiquetas
      return newAnnotations;
    });
  };

  const handleRemoveAllAnnotations = () => {
    setAnnotations([]);
    setLabelList([]);
    setDrawingEnabled(false); // Desactiva el modo de dibujo
    document.body.style.cursor = "default"; // Restablece el cursor
    setZipDownloadLink(null); // Limpia el enlace del ZIP
    setButtonsEnabled({
      draw: true,
      cancel: false,
      remove: false,
      send: false,
    }); // Restablece los botones
  };

  const handleReset = () => {
    setImage(null);
    setImageFile(null);
    setZipFile(null); // Resetear el archivo zip
    setAnnotations([]);
    setLabelList([]);
    setZipDownloadLink(null);
    setDrawingEnabled(false);
    setButtonsEnabled({
      draw: false,
      cancel: false,
      remove: false,
      send: false,
    });
    setShowNewExtraction(false); // Ocultar botón de Nueva Extracción
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach((input) => ((input as HTMLInputElement).value = "")); // Limpiar los inputs

    // Limpiar el canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height); // Limpia el canvas
      }
    }
  };

  return (
    <>
      <Navbar />
      <div className={styles.homeContainer}>
        <div className={styles.mainContainer}>
          <div className={styles.leftColumn}>
            <div className={styles.fileInputContainer}>
              {/* Input para la imagen */}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className={styles.fileInput}
              />
              {/* Input para el archivo zip */}
              <input
                type="file"
                accept=".zip"
                onChange={handleZipUpload}
                className={styles.fileInputZip}
              />
            </div>
            <div className={styles.instructions}>
              <h3>
                <strong>Instrucciones</strong>
              </h3>
              <ol>
                <li>1) Carga una imagen para activar el botón "Dibujar".</li>
                <li>2) Carga un archivo ZIP para subirlo.</li>
                <li>
                  3) Haz clic en "Dibujar" para habilitar el modo de dibujo.
                </li>
                <li>
                  4) Haz clic en la imagen para marcar el primer punto (esquina
                  superior izquierda) y el segundo punto (esquina inferior
                  derecha).
                </li>
                <li>
                  5) Selecciona una etiqueta ("text" o "img") y asigna un nombre
                  a cada área seleccionada.
                </li>
                <li>
                  6) Haz clic en "Enviar" cuando hayas terminado para enviar
                  todas las anotaciones y el archivo ZIP.
                </li>
              </ol>
            </div>

            <div className={styles.buttonContainer}>
              <button
                onClick={handleDibujarClick}
                className={styles.dibujarButton}
                disabled={!buttonsEnabled.draw} // Desactivar si no está habilitado
              >
                Dibujar
              </button>
              <button
                onClick={handleRemoveLastAnnotation}
                className={styles.actionButton}
                disabled={!buttonsEnabled.remove} // Desactivar si no está habilitado
              >
                Eliminar Etiqueta
              </button>
              <button
                onClick={handleRemoveAllAnnotations}
                className={styles.cancelButton}
                disabled={!buttonsEnabled.cancel} // Desactivar si no está habilitado
              >
                Cancelar
              </button>
              <button
                onClick={sendAnnotationsToAPI}
                className={styles.sendButton}
                disabled={!buttonsEnabled.send} // Desactivar si no está habilitado
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
            {/* Lista de etiquetas seleccionadas */}
            {labelList.length > 0 && (
              <div className={styles.labelList}>
                <h4 className={styles.title}>Etiquetas:</h4>
                <ul>
                  {labelList.map((item, index) => (
                    <li key={index}>
                      {item.label}: {item.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <h2 className={styles.title}>Resultados</h2>
            {zipDownloadLink && (
              <div className={styles.downloadContainer}>
                <a href={zipDownloadLink} download="imagenes_y_datos.zip">
                  <i className="fas fa-download"></i> Descargar ZIP (Imágenes +
                  Datos)
                </a>
              </div>
            )}

            <br />
            <br />
            {/* Botón de nueva extracción */}
            {showNewExtraction && (
              <button className={styles.resetButton} onClick={handleReset}>
                Nueva Extracción
              </button>
            )}
          </div>
        </div>

        {/* Modal de carga */}
        {isLoading && (
          <div className={styles.loadingModal}>
            <div className={styles.spinner}></div>
            <p>Enviando datos... por favor espera.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default ExtractMultiple;
