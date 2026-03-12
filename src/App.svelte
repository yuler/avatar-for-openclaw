<script>
  const SIZE = 512;

  const logoOptions = [
    { id: 'a', name: 'OpenClaw Mark A', src: '/logos/openclaw-mark-a.svg' },
    { id: 'b', name: 'OpenClaw Mark B', src: '/logos/openclaw-mark-b.svg' }
  ];

  const cornerOptions = [
    { id: 'top-left', label: '左上角' },
    { id: 'top-right', label: '右上角' },
    { id: 'bottom-left', label: '左下角' },
    { id: 'bottom-right', label: '右下角' }
  ];

  const radiusOptions = [
    { id: 'none', label: '直角', value: 0 },
    { id: 'sm', label: '小圆角', value: 18 },
    { id: 'lg', label: '大圆角', value: 56 },
    { id: 'xl', label: '超大圆角', value: 96 },
    { id: 'full', label: '全圆角', value: 999 }
  ];

  const borderPresets = [
    { id: 'red', label: '红色', value: '#ef4444' },
    { id: 'blue', label: '蓝色', value: '#3b82f6' },
    { id: 'custom', label: '自定义', value: '' }
  ];

  let fileInput;
  let uploadName = '';
  let outputDataUrl = '';
  let downloadName = 'openclaw-avatar.png';

  let selectedLogo = logoOptions[0].id;
  let logoPosition = cornerOptions[3].id;
  let cornerRadiusType = radiusOptions[1].id;
  let borderMode = borderPresets[0].id;
  let customBorderColor = '#ffffff';

  let originalImage = null;

  const loadImage = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Image could not be loaded'));
      img.src = src;
    });

  const currentRadius = () => radiusOptions.find((item) => item.id === cornerRadiusType)?.value ?? 0;
  const currentBorderColor = () => {
    if (borderMode === 'custom') return customBorderColor || '#ffffff';
    return borderPresets.find((item) => item.id === borderMode)?.value ?? '#ef4444';
  };

  function roundedRectPath(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function getBadgeRect(canvasSize, badgeSize, padding) {
    const cornerMap = {
      'top-left': [padding, padding],
      'top-right': [canvasSize - badgeSize - padding, padding],
      'bottom-left': [padding, canvasSize - badgeSize - padding],
      'bottom-right': [canvasSize - badgeSize - padding, canvasSize - badgeSize - padding]
    };

    return cornerMap[logoPosition] ?? cornerMap['bottom-right'];
  }

  async function renderAvatar() {
    if (!originalImage) return;

    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');

    const side = Math.min(originalImage.width, originalImage.height);
    const sx = Math.floor((originalImage.width - side) / 2);
    const sy = Math.floor((originalImage.height - side) / 2);

    const radiusValue = currentRadius();
    const radius = radiusValue >= 999 ? SIZE / 2 : radiusValue;

    roundedRectPath(ctx, 0, 0, SIZE, SIZE, radius);
    ctx.save();
    ctx.clip();
    ctx.drawImage(originalImage, sx, sy, side, side, 0, 0, SIZE, SIZE);
    ctx.restore();

    const borderWidth = 14;
    ctx.lineWidth = borderWidth;
    ctx.strokeStyle = currentBorderColor();
    roundedRectPath(ctx, borderWidth / 2, borderWidth / 2, SIZE - borderWidth, SIZE - borderWidth, Math.max(0, radius - borderWidth / 2));
    ctx.stroke();

    const logo = await loadImage(logoOptions.find((item) => item.id === selectedLogo)?.src || logoOptions[0].src);
    const badgeSize = Math.round(SIZE * 0.24);
    const padding = Math.round(SIZE * 0.04);
    const [x, y] = getBadgeRect(SIZE, badgeSize, padding);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    roundedRectPath(ctx, x - 10, y - 10, badgeSize + 20, badgeSize + 20, 24);
    ctx.fill();

    ctx.drawImage(logo, x, y, badgeSize, badgeSize);

    outputDataUrl = canvas.toDataURL('image/png');
  }

  async function processAvatar(file) {
    if (!file || !file.type.startsWith('image/')) return;

    uploadName = file.name;
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'avatar';
    downloadName = `${baseName}-openclaw.png`;

    const tempURL = URL.createObjectURL(file);
    try {
      originalImage = await loadImage(tempURL);
      await renderAvatar();
    } finally {
      URL.revokeObjectURL(tempURL);
    }
  }

  async function handleFileChange(event) {
    await processAvatar(event.target.files?.[0]);
  }

  async function handleDrop(event) {
    event.preventDefault();
    await processAvatar(event.dataTransfer.files?.[0]);
    if (fileInput) fileInput.files = event.dataTransfer.files;
  }

  $: if (originalImage) {
    renderAvatar();
  }
</script>

<main class="min-h-screen bg-zinc-950 px-4 py-6 text-zinc-100">
  <div class="mx-auto flex w-full max-w-5xl flex-col gap-4">
    <header class="space-y-2">
      <p class="inline-block rounded-full border border-zinc-700 px-3 py-1 text-xs tracking-wider text-zinc-300">OPENCLAW AVATAR MAKER</p>
      <h1 class="text-2xl font-semibold leading-tight text-white">上传头像 → 添加 OpenClaw Logo → 下载</h1>
      <p class="text-sm text-zinc-400">黑白灰风格，移动端优先。所有处理都在本地浏览器中完成。</p>
    </header>

    <section class="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
      <div class="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <label
          for="avatar"
          class="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-950 p-4 text-center"
          on:dragover|preventDefault
          on:drop={handleDrop}
        >
          <span class="text-sm font-medium">点击或拖拽上传头像</span>
          <span class="mt-1 text-xs text-zinc-400">支持 PNG / JPG / WEBP</span>
        </label>
        <input bind:this={fileInput} id="avatar" type="file" accept="image/*" class="hidden" on:change={handleFileChange} />

        {#if uploadName}
          <div class="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-300">当前文件：{uploadName}</div>
        {/if}

        <div class="space-y-3">
          <h2 class="text-sm font-semibold">1) Logo 选择</h2>
          <div class="grid grid-cols-2 gap-2">
            {#each logoOptions as item}
              <button
                type="button"
                class={`rounded-lg border p-2 text-xs ${selectedLogo === item.id ? 'border-white bg-zinc-800' : 'border-zinc-700 bg-zinc-900'}`}
                on:click={() => (selectedLogo = item.id)}
              >
                <img src={item.src} alt={item.name} class="mx-auto h-10 w-10 rounded" />
                <span class="mt-1 block">{item.name}</span>
              </button>
            {/each}
          </div>
        </div>

        <div class="space-y-3">
          <h2 class="text-sm font-semibold">2) Logo 位置</h2>
          <div class="grid grid-cols-2 gap-2">
            {#each cornerOptions as option}
              <button
                type="button"
                class={`rounded-md border px-2 py-2 text-xs ${logoPosition === option.id ? 'border-white bg-zinc-800' : 'border-zinc-700 bg-zinc-900'}`}
                on:click={() => (logoPosition = option.id)}
              >
                {option.label}
              </button>
            {/each}
          </div>
        </div>

        <div class="space-y-3">
          <h2 class="text-sm font-semibold">3) 头像圆角</h2>
          <div class="grid grid-cols-3 gap-2">
            {#each radiusOptions as option}
              <button
                type="button"
                class={`rounded-md border px-2 py-2 text-xs ${cornerRadiusType === option.id ? 'border-white bg-zinc-800' : 'border-zinc-700 bg-zinc-900'}`}
                on:click={() => (cornerRadiusType = option.id)}
              >
                {option.label}
              </button>
            {/each}
          </div>
        </div>

        <div class="space-y-3">
          <h2 class="text-sm font-semibold">4) Border 颜色</h2>
          <div class="grid grid-cols-3 gap-2">
            {#each borderPresets as option}
              <button
                type="button"
                class={`rounded-md border px-2 py-2 text-xs ${borderMode === option.id ? 'border-white bg-zinc-800' : 'border-zinc-700 bg-zinc-900'}`}
                on:click={() => (borderMode = option.id)}
              >
                {option.label}
              </button>
            {/each}
          </div>
          {#if borderMode === 'custom'}
            <label class="flex items-center gap-2 text-xs text-zinc-300">
              自定义颜色
              <input class="h-8 w-10 rounded border border-zinc-600 bg-transparent" type="color" bind:value={customBorderColor} />
              <span>{customBorderColor}</span>
            </label>
          {/if}
        </div>

        <a
          href={outputDataUrl || '#'}
          download={downloadName}
          aria-disabled={!outputDataUrl}
          class="block rounded-lg bg-white px-4 py-3 text-center text-sm font-semibold text-zinc-900 disabled:pointer-events-none disabled:opacity-40"
        >下载头像</a>
      </div>

      <div class="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <div class="flex min-h-[320px] items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950 p-3">
          {#if outputDataUrl}
            <img src={outputDataUrl} alt="OpenClaw 头像预览" class="h-auto max-h-[500px] w-full max-w-[500px] object-contain" />
          {:else}
            <p class="text-center text-sm text-zinc-400">上传后在这里实时预览。</p>
          {/if}
        </div>
      </div>
    </section>
  </div>
</main>
