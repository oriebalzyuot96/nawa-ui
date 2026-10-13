// Keep a slider's visible value in sync with its <input type="range">.
document.addEventListener('input', (event) => {
  const input = event.target as HTMLInputElement;
  if (!input.matches('input.pl-slider[data-pl-output]')) return;
  const output = document.getElementById(input.dataset.plOutput ?? '');
  if (output) output.textContent = input.value;
});
