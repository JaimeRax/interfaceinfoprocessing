import React, { useState } from "react";
import Navbar from "../pages/components/Navbar";
import styles from "../styles/Home.module.css";
import Image from "next/image";
import paso1 from "../img/paso1.png"; // La imagen anterior de paso1
import paso2 from "../img/paso2.png"; // La imagen anterior de paso2
import paso3 from "../img/paso3.png"; // La imagen anterior de paso3

const Home = () => {
  const [isZoomed, setIsZoomed] = useState<number | null>(null); // Estado para la imagen ampliada

  const handleImageClick = (step: number) => {
    setIsZoomed(step); // Establecer la imagen que se ha clicado
  };

  const handleOverlayClick = () => {
    setIsZoomed(null); // Cerrar imagen ampliada cuando se haga clic fuera
  };

  return (
    <div className={styles.homeContainer}>
      <div className={styles.container}>
        <Navbar />
        <div className={styles.mainContent}>
          {/* Sección izquierda: descripción del sistema */}
          <div className={styles.leftSection}>
            <h1>
              Bienvenido a <strong>extractData</strong>
            </h1>
            <p>
              extract<strong>Data</strong> es un sistema avanzado que optimiza
              la extracción de texto e imágenes de tus documentos. Ya sea que
              necesites extraer información clave de una sola imagen o procesar
              múltiples archivos, extract<strong>Data</strong> te facilita esta
              tarea.
            </p>
            <h2>Extracción personalizada</h2>
            <p>
              Selecciona áreas específicas en una imagen para extraer texto o
              imágenes. Define exactamente qué partes del documento son
              relevantes y obtén resultados precisos en formato{" "}
              <strong>TXT</strong>,<strong> JSON</strong> o como recortes de
              imagen.
            </p>
            <h2>Extracción multiple con plantillas</h2>
            <p>
              Si tienes un conjunto de imágenes similares, puedes utilizar una
              plantilla para realizar la extracción de manera multiple. Carga un
              archivo <strong>ZIP</strong> que contenga múltiples imágenes del
              mismo formato y define en la plantilla la parte que te interesa.
              Esto permite extraer datos de manera eficiente sin tener que
              seleccionar cada área de las imágenes individualmente. Los
              resultados pueden obtenerse como texto en archivos separados o
              como recortes de imágenes.
            </p>
            <h2>Beneficios del sistema</h2>
            <ul>
              <li>
                <strong>Eficiencia</strong>: Procesa múltiples imágenes de forma
                simultánea, ahorrando tiempo.
              </li>
              <li>
                <strong>Flexibilidad</strong>: Extrae texto o imágenes según las
                necesidades del proyecto.
              </li>
              <li>
                <strong>Automatización</strong>: Carga archivos ZIP y permite
                que el sistema haga el trabajo por ti, extrayendo
                automáticamente el contenido deseado.
              </li>
            </ul>
          </div>

          {/* Sección derecha: pasos a seguir */}
          <div className={styles.rightSection}>
            <h2>Pasos a seguir</h2>
            <div className={styles.step}>
              <h3>Paso 1: Subir la plantilla y archivos ZIP</h3>
              <p>
                Selecciona la imagen de plantilla en el espacio designado y sube
                el archivo ZIP que contiene las imágenes a procesar. Asegúrate
                de que todas las imágenes sean similares a la plantilla
                seleccionada.
              </p>
            </div>
            <div className={styles.step}>
              <h3>Paso 2: Seleccionar el área de extracción</h3>
              <p>
                Define en la plantilla las áreas específicas de las que deseas
                extraer información. Haz clic en los puntos de la imagen para
                marcar el área de extracción, ya sea para texto o recorte de
                imagen.
              </p>
            </div>
            <div className={styles.step}>
              <h3>Paso 3: Confirmar y extraer datos</h3>
              <p>
                Una vez seleccionadas las áreas de interés, el sistema procesará
                el archivo ZIP, extrayendo texto o imágenes de cada archivo
                según la configuración. Recibirás los resultados en formato TXT
                o en imágenes recortadas.
              </p>
            </div>
          </div>
        </div>

        {/* Sección de imágenes en horizontal con bordes y radio */}
        <div className={styles.foot}>
          <div
            className={styles.stepContainer}
            onClick={() => handleImageClick(1)}
          >
            <h3>Paso 1: (click sobre la imagen)</h3>
            <Image src={paso1} alt="Paso 1: Subir plantilla" width={400} />
          </div>
          <div
            className={styles.stepContainer}
            onClick={() => handleImageClick(2)}
          >
            <h3>Paso 2: (click sobre la imagen)</h3>
            <Image
              src={paso2}
              alt="Paso 2: Seleccionar área de extracción"
              width={350}
            />
          </div>
          <div
            className={styles.stepContainer}
            onClick={() => handleImageClick(3)}
          >
            <h3>Paso 3: (click sobre la imagen)</h3>
            <Image
              src={paso3}
              alt="Paso 3: Confirmar y extraer datos"
              width={350}
            />
          </div>
        </div>

        {isZoomed && (
          <div className={styles.overlay} onClick={handleOverlayClick}>
            <div className={styles.zoomedImageContainer}>
              {isZoomed === 1 && (
                <Image
                  src={paso1}
                  alt="Paso 1: Subir plantilla"
                  layout="fill"
                  objectFit="contain"
                />
              )}
              {isZoomed === 2 && (
                <Image
                  src={paso2}
                  alt="Paso 2: Seleccionar área de extracción"
                  layout="fill"
                  objectFit="contain"
                />
              )}
              {isZoomed === 3 && (
                <Image
                  src={paso3}
                  alt="Paso 3: Confirmar y extraer datos"
                  layout="fill"
                  objectFit="contain"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
