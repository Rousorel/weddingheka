// countdown.js
// Actualiza el contador de boda cada segundo

document.addEventListener("DOMContentLoaded", () => {
  const countdownEl = document.getElementById("countdown");
  const contadorSection = document.getElementById("contador");

  // Si el contador no existe en esta página, salir sin error
  if (!countdownEl) return;

  // Fecha fallback (ISO 8601)
  const fallbackDate = "2026-05-02T16:00:00";
  const targetIso = contadorSection?.dataset?.date || fallbackDate;
  const targetDate = new Date(targetIso);

  if (isNaN(targetDate)) {
    countdownEl.textContent = "Fecha inválida";
    return;
  }

  const daysEl = document.getElementById("countdown-days");
  const hoursEl = document.getElementById("countdown-hours");
  const minutesEl = document.getElementById("countdown-minutes");
  const secondsEl = document.getElementById("countdown-seconds");

  // Si falta algún elemento interno, salir sin romper la página
  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

  function formatNumber(n) {
    return String(n).padStart(2, "0");
  }

  function update() {
    const now = new Date();
    const diff = targetDate - now;

    if (diff <= 0) {
      countdownEl.innerHTML = "💍 ¡Hoy es el gran día!";
      clearInterval(timer);
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);

    daysEl.textContent = Math.floor(totalSeconds / 86400);
    hoursEl.textContent = formatNumber(Math.floor((totalSeconds % 86400) / 3600));
    minutesEl.textContent = formatNumber(Math.floor((totalSeconds % 3600) / 60));
    secondsEl.textContent = formatNumber(totalSeconds % 60);
  }

  update();
  const timer = setInterval(update, 1000);
});