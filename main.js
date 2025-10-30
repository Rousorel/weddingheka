import { db } from "./firebase-config.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

console.log("🔥 Firebase conectado correctamente:", db);

// Buscar invitado
const btnBuscar = document.getElementById("buscarInvitado");
const inputCodigo = document.getElementById("codigo");
const invitadoInfo = document.getElementById("invitado-info");
const nombreInvitado = document.getElementById("nombreInvitado");
const formConfirmacion = document.getElementById("formConfirmacion");
const inputAcompanantes = document.getElementById("acompanantes");
const mensaje = document.getElementById("mensajeConfirmacion");

btnBuscar.addEventListener("click", async () => {
  const codigo = inputCodigo.value.trim();
  if (!codigo) return alert("Por favor ingresa tu código.");

  const ref = doc(db, "invitados", codigo);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    alert("Código no encontrado.");
    return;
  }

  const data = snap.data();
  invitadoInfo.classList.remove("oculto");
  nombreInvitado.textContent = `Hola, ${data.nombre}`;
  inputAcompanantes.max = data.acompanantes_permitidos;
});

// Confirmar asistencia
formConfirmacion.addEventListener("submit", async (e) => {
  e.preventDefault();

  const codigo = inputCodigo.value.trim();
  const asistencia = document.getElementById("asistencia").value;
  const acompanantes = parseInt(inputAcompanantes.value) || 0;

  const ref = doc(db, "invitados", codigo);
  await updateDoc(ref, {
    asistencia_confirmada: asistencia === "si",
    acompanantes_confirmados: acompanantes
  });

  mensaje.textContent = "✅ ¡Gracias por confirmar tu asistencia!";
  formConfirmacion.reset();
});
