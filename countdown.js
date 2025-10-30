// countdown.js
// Módulo que actualiza #countdown cada segundo.
// Funciona con un atributo data-date en la sección #contador (opcional), o con la fecha hardcodeada abajo.

// 1) Si quieres controlar la fecha desde el HTML, añade esto a tu <section id="contador">:
//    <section id="contador" data-date="2025-02-15T16:00:00">
// 2) Si no añades data-date, modifica la constante fallbackDate más abajo.

const countdownEl = document.getElementById("countdown");
const contadorSection = document.getElementById("contador");

// Fallback: cambia esta fecha a la que necesites (ISO 8601).
const fallbackDate = "2026-05-02T16:00:00";

// Determina la fecha objetivo: primero busca data-date en el HTML, si no existe usa fallback.
const targetIso = contadorSection?.dataset?.date || fallbackDate;
const targetDate = new Date(targetIso);

if (!countdownEl) {
  console.warn("No se encontró el elemento #countdown. Asegúrate de que exista en el HTML.");
} else if (isNaN(targetDate)) {
  countdownEl.textContent = "Fecha inválida";
  console.error("Fecha de objetivo inválida para el countdown:", targetIso);
} else {
  let timer = null;

  function formatNumber(n) {
    return String(n).padStart(2, "0");
  }

  function update() {
    const now = new Date();
    const diff = targetDate - now;

    if (diff <= 0) {
      countdownEl.textContent = "¡El gran día ya llegó!";
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      return;
    }

    const secondsTotal = Math.floor(diff / 1000);
    const days = Math.floor(secondsTotal / (60 * 60 * 24));
    const hours = Math.floor((secondsTotal % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((secondsTotal % (60 * 60)) / 60);
    const seconds = Math.floor(secondsTotal % 60);

    // Actualizar cada elemento por separado
    document.getElementById('countdown-days').textContent = days;
    document.getElementById('countdown-hours').textContent = formatNumber(hours);
    document.getElementById('countdown-minutes').textContent = formatNumber(minutes);
    document.getElementById('countdown-seconds').textContent = formatNumber(seconds);
  }

  // Primer render inmediato y luego cada segundo
  update();
  timer = setInterval(update, 1000);
}