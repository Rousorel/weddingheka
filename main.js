import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    updateDoc,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("🔥 Firebase conectado correctamente");

// Buscar invitado
const btnBuscar = document.getElementById("buscarInvitado");
const inputCodigo = document.getElementById("codigo");
const invitadoInfo = document.getElementById("invitado-info");
const nombreInvitado = document.getElementById("nombreInvitado");
const formConfirmacion = document.getElementById("formConfirmacion");
const inputAcompanantes = document.getElementById("acompanantes");
const mensaje = document.getElementById("mensajeConfirmacion");

btnBuscar.addEventListener("click", async () => {
  try {
    const codigo = inputCodigo.value.trim();
    if (!codigo) {
      alert("Por favor ingresa tu código.");
      return;
    }

    console.log("Buscando invitado con código:", codigo);

    // Obtener la colección de invitados
    const invitadosRef = collection(db, "invitados");
    // Crear una consulta para buscar por código
    const q = query(invitadosRef, where("codigo", "==", codigo));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log("No se encontró ningún invitado con ese código");
      alert("Código no encontrado.");
      return;
    }

    // Tomar el primer documento (debería ser único)
    const snap = querySnapshot.docs[0];
    const data = snap.data();
    invitadoActualId = snap.id;
    console.log("Invitado encontrado:", data, "ID:", invitadoActualId);

    invitadoInfo.classList.remove("oculto");
    nombreInvitado.textContent = `Hola, ${data.nombre}`;
    if (data.acompanantes) {
      inputAcompanantes.max = data.acompanantes;
    }
    
    // Pre-seleccionar valores si ya había confirmado antes
    if (data.estado) {
      document.getElementById("asistencia").value = data.estado === "confirmado" ? "si" : "no";
    }
    if (data.acompanantes) {
      inputAcompanantes.value = data.acompanantes;
    }
  } catch (error) {
    console.error("Error al buscar invitado:", error);
    alert("Error al buscar el código. Por favor intenta nuevamente.");
  }
});

// Variable para almacenar el ID del invitado actual
let invitadoActualId = null;

// Confirmar asistencia
formConfirmacion.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    if (!invitadoActualId) {
      alert("Por favor busca tu código de invitación primero");
      return;
    }

    const asistencia = document.getElementById("asistencia").value;
    const acompanantes = parseInt(inputAcompanantes.value) || 0;

    console.log("Actualizando invitado:", invitadoActualId);
    const ref = doc(db, "invitados", invitadoActualId);
    await updateDoc(ref, {
      estado: asistencia === "si" ? "confirmado" : "rechazado",
      acompanantes: acompanantes,
      fechaConfirmacion: new Date()
    });

    mensaje.textContent = "✅ ¡Gracias por confirmar tu asistencia!";
    formConfirmacion.reset();
    
    // Limpiar el estado
    setTimeout(() => {
      invitadoInfo.classList.add("oculto");
      mensaje.textContent = "";
      inputCodigo.value = "";
      invitadoActualId = null;
    }, 3000);
  } catch (error) {
    console.error("Error al confirmar asistencia:", error);
    alert("Error al confirmar la asistencia. Por favor intenta nuevamente.");
  }
});

document.getElementById('downloadBtn').addEventListener('click', async function () {
const imageUrl = 'images/mapamosqueda.jpg'; // Replace with your image URL
const response = await fetch(imageUrl);
const blob = await response.blob();
const url = URL.createObjectURL(blob);

const link = document.createElement('a');
link.href = url;
link.download = 'mapa-campo-mosqueda.jpg'; // Desired file name
document.body.appendChild(link);
link.click();
document.body.removeChild(link);

URL.revokeObjectURL(url); // Clean up the temporary URL
});