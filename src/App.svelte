<script>
  const SIZE = 512

  const logoOptions = [
    { id: 'png', name: 'OpenClaw (PNG)', src: '/openclaw.png' },
    { id: 'svg', name: 'OpenClaw (SVG)', src: '/openclaw.svg' },
    { id: 'wordmark', name: 'OpenClaw Wordmark Light', src: '/openclaw-wordmark-light.svg', autoWidth: true },
  ]

  const cornerOptions = [
    { id: 'top-left', label: 'Top Left', icon: '↖' },
    { id: 'top-right', label: 'Top Right', icon: '↗' },
    { id: 'bottom-left', label: 'Bottom Left', icon: '↙' },
    { id: 'bottom-right', label: 'Bottom Right', icon: '↘' },
  ]

  const radiusOptions = [
    { id: 'none', label: 'Square', value: 0, icon: '▢' },
    { id: 'sm', label: 'Small Radius', value: 18, icon: '▣' },
    { id: 'lg', label: 'Large Radius', value: 56, icon: '◧' },
    { id: 'xl', label: 'Extra Radius', value: 96, icon: '◍' },
    { id: 'full', label: 'Circle', value: 999, icon: '◯' },
  ]

  const borderPresets = [
    { id: 'violet', label: 'Violet', value: '#7c3aed' },
    { id: 'cyan', label: 'Cyan', value: '#06b6d4' },
    { id: 'custom', label: 'Custom', value: '' },
  ]

  let fileInput
  let uploadName = 'avatar.jpeg'
  let uploadedImageUrl = '/avatar.jpeg'
  let outputDataUrl = ''
  let downloadName = 'avatar-openclaw.png'

  let selectedLogo = logoOptions[0].id
  let logoPosition = cornerOptions[3].id
  let cornerRadiusType = radiusOptions[1].id
  let borderMode = borderPresets[0].id
  let customBorderColor = '#111111'

  let originalImage = null

  const loadImage = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`Image could not be loaded: ${src}`))
      img.src = src
    })

  const currentRadius = () => radiusOptions.find((item) => item.id === cornerRadiusType)?.value ?? 0
  const currentBorderColor = () => {
    if (borderMode === 'custom') return customBorderColor || '#111111'
    return borderPresets.find((item) => item.id === borderMode)?.value ?? '#7c3aed'
  }

  function roundedRectPath(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.arcTo(x + w, y, x + w, y + h, radius)
    ctx.arcTo(x + w, y + h, x, y + h, radius)
    ctx.arcTo(x, y + h, x, y, radius)
    ctx.arcTo(x, y, x + w, y, radius)
    ctx.closePath()
  }

  function getBadgeRect(canvasSize, badgeSize, padding) {
    const cornerMap = {
      'top-left': [padding, padding],
      'top-right': [canvasSize - badgeSize - padding, padding],
      'bottom-left': [padding, canvasSize - badgeSize - padding],
      'bottom-right': [canvasSize - badgeSize - padding, canvasSize - badgeSize - padding],
    }

    return cornerMap[logoPosition] ?? cornerMap['bottom-right']
  }

  async function renderAvatar() {
    if (!originalImage) return

    const canvas = document.createElement('canvas')
    canvas.width = SIZE
    canvas.height = SIZE
    const ctx = canvas.getContext('2d')

    const side = Math.min(originalImage.width, originalImage.height)
    const sx = Math.floor((originalImage.width - side) / 2)
    const sy = Math.floor((originalImage.height - side) / 2)

    const radiusValue = currentRadius()
    const radius = radiusValue >= 999 ? SIZE / 2 : radiusValue

    roundedRectPath(ctx, 0, 0, SIZE, SIZE, radius)
    ctx.save()
    ctx.clip()
    ctx.drawImage(originalImage, sx, sy, side, side, 0, 0, SIZE, SIZE)
    ctx.restore()

    const borderWidth = 14
    ctx.lineWidth = borderWidth
    ctx.strokeStyle = currentBorderColor()
    roundedRectPath(
      ctx,
      borderWidth / 2,
      borderWidth / 2,
      SIZE - borderWidth,
      SIZE - borderWidth,
      Math.max(0, radius - borderWidth / 2)
    )
    ctx.stroke()

    const logo = await loadImage(logoOptions.find((item) => item.id === selectedLogo)?.src || logoOptions[0].src)
    const padding = Math.round(SIZE * 0.04)
    const selectedOption = logoOptions.find((item) => item.id === selectedLogo)
    const isWordmark = selectedOption?.autoWidth === true

    let drawX, drawY, drawW, drawH, bgX, bgY, bgW, bgH
    if (isWordmark) {
      const maxWidth = (SIZE - 2 * padding) / 2
      const aspect = logo.naturalHeight / logo.naturalWidth
      drawW = maxWidth
      drawH = Math.round(maxWidth * aspect)
      const maxHeight = Math.round(SIZE * 0.22)
      if (drawH > maxHeight) {
        drawH = maxHeight
        drawW = Math.round(drawH / aspect)
      }
      const isLeft = logoPosition === 'top-left' || logoPosition === 'bottom-left'
      drawX = isLeft ? padding : SIZE - padding - drawW
      const [_, cornerY] = getBadgeRect(SIZE, drawH, padding)
      drawY = cornerY
      bgX = drawX - 10
      bgY = drawY - 10
      bgW = drawW + 20
      bgH = drawH + 20
    } else {
      const badgeSize = Math.round(SIZE * 0.24)
      const [x, y] = getBadgeRect(SIZE, badgeSize, padding)
      drawX = x
      drawY = y
      drawW = badgeSize
      drawH = badgeSize
      bgX = x - 10
      bgY = y - 10
      bgW = badgeSize + 20
      bgH = badgeSize + 20
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.86)'
    roundedRectPath(ctx, bgX, bgY, bgW, bgH, 24)
    ctx.fill()

    ctx.drawImage(logo, drawX, drawY, drawW, drawH)

    outputDataUrl = canvas.toDataURL('image/png')
  }

  function resetState() {
    if (uploadedImageUrl.startsWith('blob:')) URL.revokeObjectURL(uploadedImageUrl)
    uploadName = 'avatar.jpeg'
    uploadedImageUrl = '/avatar.jpeg'
    outputDataUrl = ''
    downloadName = 'avatar-openclaw.png'
    originalImage = null
  }

  async function processAvatar(file) {
    if (!file || !file.type.startsWith('image/')) return

    uploadName = file.name
    if (uploadedImageUrl.startsWith('blob:')) URL.revokeObjectURL(uploadedImageUrl)
    uploadedImageUrl = URL.createObjectURL(file)
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'avatar'
    downloadName = `${baseName}-openclaw.png`

    originalImage = await loadImage(uploadedImageUrl)
    await renderAvatar()
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    try {
      await processAvatar(file)
    } catch (error) {
      console.error('Failed to process image:', error)
      alert(error.message)
      resetState()
    }
  }

  async function handleDrop(event) {
    event.preventDefault()
    try {
      const file = event.dataTransfer.files?.[0]
      await processAvatar(file)
      if (fileInput) {
        fileInput.files = event.dataTransfer.files
      }
    } catch (error) {
      console.error('Failed to process dropped image:', error)
      alert(error.message)
      resetState()
    }
  }

  async function loadDefaultAvatar() {
    try {
      originalImage = await loadImage('/avatar.jpeg')
      await renderAvatar()
    } catch (error) {
      console.error('Default avatar missing. Upload an image to continue.', error)
    }
  }

  $: if (originalImage) {
    selectedLogo
    logoPosition
    cornerRadiusType
    borderMode
    customBorderColor
    renderAvatar()
  }
</script>

<svelte:window on:load={loadDefaultAvatar} />

<main class="min-h-screen bg-gradient-to-b from-[#f7f4ff] via-[#f8fbff] to-[#eef3ff] px-4 py-6 text-slate-900">
  <div class="mx-auto w-full max-w-6xl space-y-4">
    <header class="space-y-2 text-center md:text-left">
      <p
        class="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-3 py-1 text-xs font-semibold tracking-wide text-violet-700 shadow-sm backdrop-blur"
      >
        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2v20M2 12h20" />
        </svg>
        OPENCLAW AVATAR MAKER
      </p>
      <h1 class="text-2xl font-bold text-slate-900">Upload Avatar → Add OpenClaw Logo → Download</h1>
      <p class="text-sm text-slate-600">Notion-style pastel theme, soft cards, and all processing in your browser.</p>
    </header>

    <section class="grid gap-4 md:grid-cols-2">
      <div class="flex flex-col rounded-3xl border border-violet-200 bg-white/85 p-4 shadow-lg shadow-violet-100/60 backdrop-blur-sm">
        <label
          for="avatar"
          class="flex min-h-[280px] flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-violet-300 bg-gradient-to-b from-violet-50 to-cyan-50 p-4 text-center text-slate-700"
          on:dragover|preventDefault
          on:drop={handleDrop}
        >
          {#if outputDataUrl}
            <img src={outputDataUrl} alt="Avatar preview" class="min-h-0 w-full flex-1 object-contain" />
          {:else}
            <svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 16V4" /><path d="m7 9 5-5 5 5" />
              <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 16.25" /><path d="M8 16h8" />
            </svg>
            <span class="mt-2 text-sm font-semibold">Click or drag to upload an avatar</span>
            <span class="mt-1 text-xs text-slate-500">PNG / JPG / WEBP</span>
          {/if}
        </label>
        <input
          bind:this={fileInput}
          id="avatar"
          type="file"
          accept="image/*"
          class="hidden"
          on:change={handleFileChange}
        />
      </div>

      <div class="space-y-4 rounded-3xl border border-violet-200 bg-white/85 p-4 shadow-lg shadow-violet-100/60 backdrop-blur-sm">
        <div class="space-y-3">
          <h2 class="text-sm font-semibold text-slate-700">1) OpenClaw Logo</h2>
          <div class="grid grid-cols-2 gap-2">
            {#each logoOptions as item}
              <button
                type="button"
                class={`rounded-xl border px-2 py-2 text-xs transition ${selectedLogo === item.id ? 'border-violet-500 bg-violet-600 text-white shadow-md shadow-violet-200' : 'border-violet-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50'}`}
                on:click={() => (selectedLogo = item.id)}
              >
                <img src={item.src} alt={item.name} class="mx-auto h-10 rounded" />
                <span class="mt-1 block">{item.name}</span>
              </button>
            {/each}
          </div>
        </div>

        <div class="space-y-3">
          <h2 class="text-sm font-semibold text-slate-700">2) Logo Position</h2>
          <div class="flex flex-wrap gap-2">
            {#each cornerOptions as option}
              <button
                type="button"
                class={`rounded-lg border px-2 py-2 text-xs transition ${logoPosition === option.id ? 'border-violet-500 bg-violet-600 text-white shadow-sm shadow-violet-200' : 'border-violet-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50'}`}
                on:click={() => (logoPosition = option.id)}
              >
                <span class="mr-1">{option.icon}</span>{option.label}
              </button>
            {/each}
          </div>
        </div>

        <div class="space-y-3">
          <h2 class="text-sm font-semibold text-slate-700">3) Avatar Radius</h2>
          <div class="flex flex-wrap gap-2">
            {#each radiusOptions as option}
              <button
                type="button"
                class={`rounded-lg border px-2 py-2 text-xs transition ${cornerRadiusType === option.id ? 'border-violet-500 bg-violet-600 text-white shadow-sm shadow-violet-200' : 'border-violet-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50'}`}
                on:click={() => (cornerRadiusType = option.id)}
              >
                <span class="mr-1">{option.icon}</span>{option.label}
              </button>
            {/each}
          </div>
        </div>

        <div class="space-y-3">
          <h2 class="text-sm font-semibold text-slate-700">4) Border Color</h2>
          <div class="grid grid-cols-3 gap-2">
            {#each borderPresets as option}
              <button
                type="button"
                class={`rounded-lg border px-2 py-2 text-xs transition ${borderMode === option.id ? 'border-violet-500 bg-violet-600 text-white shadow-sm shadow-violet-200' : 'border-violet-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50'}`}
                on:click={() => (borderMode = option.id)}
              >
                {option.label}
              </button>
            {/each}
          </div>
          {#if borderMode === 'custom'}
            <label class="flex items-center gap-2 text-xs text-slate-700">
              Custom color
              <input class="h-8 w-10 rounded-lg border border-violet-200" type="color" bind:value={customBorderColor} />
              <span>{customBorderColor}</span>
            </label>
          {/if}
        </div>

        <a
          href={outputDataUrl || '#'}
          download={downloadName}
          aria-disabled={!outputDataUrl}
          class="block rounded-xl border border-violet-500 bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-violet-300/40 transition hover:from-violet-500 hover:to-indigo-500 aria-disabled:pointer-events-none aria-disabled:opacity-40"
        >
          Download PNG
        </a>
      </div>
    </section>
  </div>
</main>
