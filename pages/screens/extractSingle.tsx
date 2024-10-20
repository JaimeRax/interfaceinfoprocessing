import React, { useRef, useState } from "react";
import Swal from "sweetalert2";
import styles from "../../styles/extractSingle.module.css";

const ExtactSingle = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [currentCoords, setCurrentCoords] = useState<
    { x: number; y: number }[]
  >([]);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [drawingEnabled, setDrawingEnabled] = useState<boolean>(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        setImage(img);
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = 600; // Fijo el ancho del canvas
          canvas.height = (600 * img.height) / img.width; // Mantener la proporción de la imagen
        }
      };
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingEnabled) return; // No hace nada si el modo de dibujo está desactivado

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Agrega el punto actual a las coordenadas
    const newCoords = [...currentCoords, { x, y }];
    setCurrentCoords(newCoords);

    // Dibuja el punto inmediatamente
    drawPoint(x, y);

    // Si hay dos puntos, llama a la función de anotación
    if (newCoords.length === 2) {
      promptForAnnotation(newCoords[0].x, newCoords[0].y, x, y);
    }
  };

  const drawPoint = (x: number, y: number) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (context) {
      context.fillStyle = "red"; // Color para los puntos
      context.beginPath();
      context.arc(x, y, 5, 0, Math.PI * 2);
      context.fill();
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
        setCurrentCoords([]); // Resetea las coordenadas
      }
    });
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (context && image) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height); // Mantener el tamaño fijo de la imagen

      // Dibuja los puntos de las anotaciones
      annotations.forEach((annotation) => {
        const [[x1, y1], [x2, y2]] = annotation;
        drawPoint(x1, y1);
        drawPoint(x2, y2);
      });
    }
  };

  const handleDibujarClick = () => {
    setDrawingEnabled(true); // Activa el modo de dibujo
  };

  const handleRemoveLastAnnotation = () => {
    setAnnotations((prev) => {
      const newAnnotations = prev.slice(0, -1);
      return newAnnotations;
    });
  };

  const handleRemoveAllAnnotations = () => {
    setAnnotations([]);
  };

  // Dibuja en el canvas cuando hay cambios en la imagen o las anotaciones
  React.useEffect(() => {
    drawCanvas();
  }, [image, annotations]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>extractData Single</h1>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      <button
        onClick={handleDibujarClick}
        className={styles.dibujarButton}
        disabled={drawingEnabled}
      >
        Dibujar
      </button>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onClick={handleCanvasClick}
      ></canvas>
      <div className={styles.buttonContainer}>
        <button
          onClick={handleRemoveLastAnnotation}
          className={styles.actionButton}
        >
          Eliminar Última Etiqueta
        </button>
        <button
          onClick={handleRemoveAllAnnotations}
          className={styles.actionButton}
        >
          Eliminar Todas las Etiquetas
        </button>
      </div>
      <div className={styles.annotations}>
        <h2>Anotaciones</h2>
        <pre>{JSON.stringify(annotations, null, 2)}</pre>
      </div>
    </div>
  );
};

export default ExtactSingle;
