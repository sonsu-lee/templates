document.querySelectorAll('[data-copy-target]').forEach((copyButton) => {
  const originalLabel = copyButton.textContent;
  let resetTimer;

  copyButton.addEventListener('click', async () => {
    const command = document.getElementById(copyButton.dataset.copyTarget)?.textContent;
    if (!command) return;

    try {
      await navigator.clipboard.writeText(command);
      copyButton.textContent = 'Copied!';
    } catch {
      copyButton.textContent = 'Select command above';
    }

    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      copyButton.textContent = originalLabel;
    }, 2400);
  });
});
