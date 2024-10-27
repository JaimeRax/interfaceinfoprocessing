import React, { useRef, useState } from "react";
import Swal from "sweetalert2";
import styles from "../../styles/extractSingle.module.css";
import Navbar from "../components/Navbar";
import axios from "axios";

const ExtactSingle = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showResizeButton, setShowResizeButton] = useState<boolean>(false); // Estado para mostrar el botón de redimensionar y descargar
  const [currentCoords, setCurrentCoords] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [drawingEnabled, setDrawingEnabled] = useState<boolean>(false);
  const [zipDownloadLink, setZipDownloadLink] = useState<string | null>(null);
  const [labelList, setLabelList] = useState<any[]>([]); // Para la lista de etiquetas
  const [buttonsEnabled, setButtonsEnabled] = useState({
    draw: false,
    cancel: false,
    remove: false,
    send: true,
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
        setImageFile(file);
        if (img.width > 1200 || img.height > 1200) {
          Swal.fire({
            icon: "error",
            title: "Imagen demasiado grande",
            text: "La imagen supera el tamaño máximo permitido de 1200px de ancho o alto.",
          });
          setShowResizeButton(true); // Mostrar el botón de redimensionar y descargar
          setImage(null); // No cargar la imagen original en el canvas
          return; // No continuar si la imagen es demasiado grande
        }

        setImage(img);
        setImageFile(file);
        setShowResizeButton(false);
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

  // Función para redimensionar y descargar la imagen si excede los 1200px
  const handleResizeAndDownload = () => {
    if (!imageFile) return;

    const img = new Image();
    img.src = URL.createObjectURL(imageFile);

    img.onload = () => {
      let newWidth = img.width;
      let newHeight = img.height;

      if (img.width > img.height && img.width > 1200) {
        newWidth = 1100;
        newHeight = (img.height * 1100) / img.width;
      } else if (img.height > img.width && img.height > 1200) {
        newHeight = 1100;
        newWidth = (img.width * 1100) / img.height;
      }

      // Crear un canvas temporal para redimensionar la imagen
      const resizeCanvas = document.createElement("canvas");
      resizeCanvas.width = newWidth;
      resizeCanvas.height = newHeight;
      const resizeContext = resizeCanvas.getContext("2d");

      if (resizeContext) {
        resizeContext.clearRect(0, 0, newWidth, newHeight);
        resizeContext.drawImage(img, 0, 0, newWidth, newHeight);

        // Convertir el canvas a una URL de datos de imagen
        const resizedURL = resizeCanvas.toDataURL("image/jpeg", 1.0);

        // Crear un enlace de descarga y simular un clic para descargar la imagen redimensionada
        const downloadLink = document.createElement("a");
        downloadLink.href = resizedURL;
        downloadLink.download = "imagen_redimensionada.jpg";
        downloadLink.click();

        // Ocultar el botón de redimensionar después de descargar
        setShowResizeButton(false);
      }
    };
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

    if (!currentCoords) {
      // Primer clic: establecer el punto de inicio y dibujar el primer punto
      setCurrentCoords({ x, y });
    } else {
      // Segundo clic: finalizar el rectángulo y solicitar la anotación
      drawRectangle(currentCoords, { x, y });
      promptForAnnotation(currentCoords.x, currentCoords.y, x, y);
      setCurrentCoords(null); // Reiniciar el punto de inicio
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

  // Función para dibujar el rectángulo en tiempo real
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!currentCoords || !image) return; // Solo dibujar si hay un punto de inicio

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / image.width;
    const scaleY = canvas.height / image.height;

    const x = Math.round((event.clientX - rect.left) / scaleX);
    const y = Math.round((event.clientY - rect.top) / scaleY);

    drawRectangle(currentCoords, { x, y });
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
        <label for="name">Nombre:</label>
        <input id="name" class="swal2-input" required>
        <br>
        <br>
        <label for="label">Etiqueta:</label>
        <select id="label" class="swal2-input">
          <option value="text">text</option>
          <option value="img">img</option>
        </select>
      `,
      preConfirm: () => {
        const label = (document.getElementById("label") as HTMLSelectElement)
          .value;
        const name = (document.getElementById("name") as HTMLInputElement)
          .value;
        if (!name) {
          Swal.showValidationMessage("El nombre es obligatorio");
        }
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

  // Función para enviar las anotaciones a la API
  const sendAnnotationsToAPI = async () => {
    if (!imageFile) {
      console.log("No se ha cargado una imagen."); // Verificación en consola

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Debe cargar una imagen antes de enviar.",
      });
      return;
    }
    if (annotations.length === 0) {
      console.log("No se ha dibujado ninguna area."); // Verificación en consola

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Debe dibujar al menos un área antes de enviar.",
      });
      return;
    }

    setIsLoading(true); // Mostrar modal de carga
    const formData = new FormData();
    formData.append("template_image", imageFile);
    formData.append("roi_array", JSON.stringify(annotations));

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL_LECTOR}/extract_single`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          responseType: "blob",
        },
      );

      const zipUrl = URL.createObjectURL(
        new Blob([response.data], { type: "application/zip" }),
      );
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
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      (fileInput as HTMLInputElement).value = "";
    }

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
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className={styles.fileInput}
            />
            {showResizeButton && (
              <button
                onClick={handleResizeAndDownload}
                className={styles.resizeButton}
              >
                Redimensionar Imagen
              </button>
            )}
            <div className={styles.instructions}>
              <h3>
                <strong>Instrucciones</strong>
              </h3>
              <ol>
                <li>1) Carga una imagen para activar el botón "Dibujar".</li>
                <li>
                  2) Haz clic en "Dibujar" para habilitar el modo de dibujo.
                </li>
                <li>
                  3) Haz clic en la imagen para marcar el primer punto, luego
                  arrastra el cursor hasta el segundo punto para ver el
                  rectángulo de selección. Haz clic de nuevo para fijar el área
                  seleccionada.
                </li>
                <li>
                  4) Selecciona una etiqueta ("text" o "img") y asigna un nombre
                  a cada área seleccionada.
                </li>
                <li>
                  5) Haz clic en "Enviar" cuando hayas terminado para enviar
                  todas las anotaciones a la API.
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
              onMouseMove={handleMouseMove}
              style={{ border: "2px solid #000" }} // Agrega un borde al canvas
            ></canvas>
          </div>

          {/* Columna derecha para el enlace de descarga ZIP */}
          <div className={styles.rightColumn}>
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

export default ExtactSingle;
