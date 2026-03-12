<script>
  const MAX_OUTPUT_SIZE = 512;
  const LOGO_TEXT = '🦐';

  let fileInput;
  let uploadName = '';
  let sourceImageUrl = '';
  let outputDataUrl = '';
  let downloadName = 'openclaw-avatar.png';

  function resetState() {
    sourceImageUrl = '';
    outputDataUrl = '';
    uploadName = '';
    downloadName = 'openclaw-avatar.png';
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Image could not be loaded.'));
      img.src = src;
    });
  }

  async function processAvatar(file) {
    if (!file || !file.type.startsWith('image/')) {
      resetState();
      return;
    }

    uploadName = file.name;
    const fileUrl = URL.createObjectURL(file);

    try {
      const image = await loadImage(fileUrl);
      const canvas = document.createElement('canvas');
      const ratio = image.width / image.height;
      let targetWidth = MAX_OUTPUT_SIZE;
      let targetHeight = MAX_OUTPUT_SIZE;

      if (ratio > 1) {
        targetHeight = Math.round(MAX_OUTPUT_SIZE / ratio);
      } else {
        targetWidth = Math.round(MAX_OUTPUT_SIZE * ratio);
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

      const padding = Math.round(Math.max(targetWidth, targetHeight) * 0.04);
      const badgeSize = Math.round(Math.max(targetWidth, targetHeight) * 0.3);
      const badgeX = targetWidth - badgeSize - padding;
      const badgeY = targetHeight - badgeSize - padding;
      const cornerRadius = Math.round(badgeSize * 0.2);

      ctx.fillStyle = 'rgba(2, 6, 23, 0.84)';
      roundedRect(ctx, badgeX, badgeY, badgeSize, badgeSize, cornerRadius);
      ctx.fill();

      ctx.font = `${Math.round(badgeSize * 0.65)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(LOGO_TEXT, badgeX + badgeSize / 2, badgeY + badgeSize / 2 + 1);

      outputDataUrl = canvas.toDataURL('image/png');
      sourceImageUrl = outputDataUrl;
      const baseName = file.name.replace(/\.[^.]+$/, '') || 'avatar';
      downloadName = `${baseName}-openclaw.png`;
    } finally {
      URL.revokeObjectURL(fileUrl);
    }
  }

  function roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    await processAvatar(file);
  }

  async function handleDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    await processAvatar(file);
    if (fileInput) {
      fileInput.files = event.dataTransfer.files;
    }
  }
</script>

<main class="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-4 py-10 text-slate-100 sm:px-8">
  <header class="space-y-3 text-center">
    <p class="inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-200">
      OpenClaw Avatar Tool
    </p>
    <h1 class="text-3xl font-bold text-white sm:text-4xl">Upload your avatar, add the 🦐 badge, download instantly.</h1>
    <p class="mx-auto max-w-2xl text-sm text-slate-300 sm:text-base">
      Create a bot-ready avatar with the OpenClaw logo directly in your browser. No server upload required.
    </p>
  </header>

  <section class="grid gap-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-2xl shadow-cyan-950/40 md:grid-cols-2 md:p-8">
    <div class="space-y-4">
      <label
        class="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-8 text-center transition hover:border-cyan-400 hover:bg-slate-900"
        for="avatar"
        on:dragover|preventDefault
        on:drop={handleDrop}
      >
        <span class="text-4xl">📷</span>
        <span class="text-sm font-medium text-slate-100">Drop an image or click to upload</span>
        <span class="text-xs text-slate-400">PNG, JPG, or WEBP</span>
      </label>
      <input bind:this={fileInput} id="avatar" class="hidden" type="file" accept="image/*" on:change={handleFileChange} />

      {#if uploadName}
        <p class="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300">
          Selected: <span class="font-semibold text-slate-100">{uploadName}</span>
        </p>
      {/if}

      <a
        class="inline-flex w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-brand-400 disabled:pointer-events-none disabled:opacity-50"
        href={outputDataUrl || '#'}
        download={downloadName}
        aria-disabled={!outputDataUrl}
      >
        Download Avatar
      </a>
    </div>

    <div class="flex min-h-72 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/80 p-4">
      {#if sourceImageUrl}
        <img class="max-h-[420px] w-auto rounded-lg object-contain" src={sourceImageUrl} alt="Avatar preview with OpenClaw logo" />
      {:else}
        <p class="max-w-xs text-center text-sm text-slate-400">
          Your processed avatar preview will appear here after upload.
        </p>
      {/if}
    </div>
  </section>
</main>
