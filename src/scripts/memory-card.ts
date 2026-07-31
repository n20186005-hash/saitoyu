type SizeKey = 'square' | 'postcard' | 'story';
type StyleKey = 'noren' | 'steam' | 'sunset' | 'tile';
type LoadedImage = ImageBitmap | HTMLImageElement;

const CARD_SIZES: Record<SizeKey, { width: number; height: number; label: string }> = {
  square: { width: 1080, height: 1080, label: '1:1' },
  postcard: { width: 1000, height: 1480, label: 'はがき縦版' },
  story: { width: 1080, height: 1920, label: '9:16' },
};

const PALETTES: Record<StyleKey, { primary: string; secondary: string; paper: string; accent: string }> = {
  noren: { primary: '#102845', secondary: '#294d78', paper: '#f5efe2', accent: '#bd6242' },
  steam: { primary: '#eaf4f3', secondary: '#9ccfd4', paper: '#fffdf7', accent: '#325c70' },
  sunset: { primary: '#3c3153', secondary: '#c96b4b', paper: '#f5dfb7', accent: '#f3c87d' },
  tile: { primary: '#173957', secondary: '#71b7bf', paper: '#f6f0de', accent: '#c76342' },
};

function requiredElement<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing element: #${id}`);
  return node as T;
}

function getImageDimensions(image: LoadedImage): { width: number; height: number } {
  if (image instanceof HTMLImageElement) {
    return { width: image.naturalWidth, height: image.naturalHeight };
  }
  return { width: image.width, height: image.height };
}

async function decodeImage(file: File): Promise<LoadedImage> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // Safari and some HEIC files may need the HTMLImageElement fallback.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: LoadedImage,
  width: number,
  height: number,
  zoomPercent: number,
  offsetPercent: number,
): void {
  const source = getImageDimensions(image);
  const baseScale = Math.max(width / source.width, height / source.height);
  const scale = baseScale * (zoomPercent / 100);
  const drawWidth = source.width * scale;
  const drawHeight = source.height * scale;
  const maxTravel = Math.max(0, (drawHeight - height) / 2);
  const yTravel = maxTravel * (offsetPercent / 35);
  const x = (width - drawWidth) / 2;
  const y = (height - drawHeight) / 2 + yTravel;
  ctx.drawImage(image, x, y, drawWidth, drawHeight);
}

function drawPlaceholder(ctx: CanvasRenderingContext2D, width: number, height: number, palette: typeof PALETTES.noren): void {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, palette.primary);
  gradient.addColorStop(1, palette.secondary);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.strokeStyle = palette.paper;
  ctx.lineWidth = Math.max(4, width * 0.006);
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const radius = width * (0.035 + ((row + col) % 3) * 0.012);
      ctx.beginPath();
      ctx.arc(width * (0.12 + col * 0.26), height * (0.12 + row * 0.19), radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();

  ctx.fillStyle = palette.paper;
  ctx.globalAlpha = 0.88;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${Math.round(width * 0.14)}px "Yu Mincho", "Hiragino Mincho ProN", serif`;
  ctx.fillText('ゆ', width / 2, height * 0.43);
  ctx.font = `700 ${Math.round(width * 0.035)}px "Hiragino Sans", "Yu Gothic", sans-serif`;
  ctx.letterSpacing = `${Math.round(width * 0.007)}px`;
  ctx.fillText('写真を選んで記念カードを作る', width / 2, height * 0.56);
  ctx.globalAlpha = 1;
}

function drawSteam(ctx: CanvasRenderingContext2D, width: number, height: number, color: string, alpha = 0.26): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(8, width * 0.014);
  const baseY = height * 0.23;
  [0.19, 0.34, 0.76, 0.88].forEach((xRatio, index) => {
    const x = width * xRatio;
    ctx.beginPath();
    ctx.moveTo(x, baseY + index * height * 0.018);
    ctx.bezierCurveTo(
      x - width * 0.08,
      baseY - height * 0.08,
      x + width * 0.09,
      baseY - height * 0.13,
      x + width * 0.01,
      baseY - height * 0.22,
    );
    ctx.stroke();
  });
  ctx.restore();
}

function drawTilePattern(ctx: CanvasRenderingContext2D, width: number, height: number, palette: typeof PALETTES.tile): void {
  const tile = Math.max(54, Math.round(width * 0.078));
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = palette.paper;
  ctx.lineWidth = Math.max(2, width * 0.0025);
  for (let x = -tile; x < width + tile; x += tile) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = -tile; y < height + tile; y += tile) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTopMark(ctx: CanvasRenderingContext2D, width: number, height: number, palette: typeof PALETTES.noren): void {
  const x = width * 0.08;
  const y = height * 0.07;
  const sealSize = width * 0.105;

  ctx.save();
  roundedRect(ctx, x, y, sealSize, sealSize, sealSize * 0.13);
  ctx.fillStyle = palette.accent;
  ctx.fill();
  ctx.fillStyle = '#fffaf0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${Math.round(sealSize * 0.45)}px "Yu Mincho", serif`;
  ctx.fillText('湯', x + sealSize / 2, y + sealSize / 2 + sealSize * 0.03);

  ctx.restore();
}

function formatJapaneseDate(value: string): string {
  if (!value) return '';
  const parts = value.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return value;
  return `${parts[0]}年${parts[1]}月${parts[2]}日`;
}

function drawCaption(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  title: string,
  date: string,
  palette: typeof PALETTES.noren,
  style: StyleKey,
  size: SizeKey,
): void {
  const side = width * 0.08;
  const bottom = height * (size === 'story' ? 0.075 : 0.085);
  const panelHeight = height * (size === 'square' ? 0.26 : 0.22);
  const panelY = height - bottom - panelHeight;

  ctx.save();
  if (size === 'postcard') {
    ctx.fillStyle = palette.paper;
    ctx.globalAlpha = 0.97;
    ctx.fillRect(0, panelY - height * 0.025, width, height - panelY + height * 0.025);
  } else {
    const gradient = ctx.createLinearGradient(0, panelY - height * 0.12, 0, height);
    gradient.addColorStop(0, 'rgba(4,14,27,0)');
    gradient.addColorStop(0.44, style === 'steam' ? 'rgba(30,63,76,.60)' : 'rgba(4,14,27,.62)');
    gradient.addColorStop(1, style === 'steam' ? 'rgba(30,63,76,.94)' : 'rgba(4,14,27,.92)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, panelY - height * 0.15, width, height - panelY + height * 0.15);
  }

  const textColor = size === 'postcard' ? palette.primary : '#fffaf0';
  const subColor = size === 'postcard' ? palette.secondary : 'rgba(255,250,240,.74)';

  ctx.fillStyle = palette.accent;
  ctx.fillRect(side, panelY + panelHeight * 0.12, width * 0.12, Math.max(5, height * 0.004));

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = textColor;
  const titleSize = Math.round(width * (title.length > 13 ? 0.066 : 0.082));
  ctx.font = `700 ${titleSize}px "Yu Mincho", "Hiragino Mincho ProN", serif`;
  ctx.letterSpacing = `${Math.max(1, Math.round(width * 0.002))}px`;
  ctx.fillText(title || '日暮里 斉藤湯', side, panelY + panelHeight * 0.54, width - side * 2);

  ctx.fillStyle = subColor;
  ctx.font = `600 ${Math.round(width * 0.026)}px "Hiragino Sans", "Yu Gothic", sans-serif`;
  ctx.letterSpacing = `${Math.max(2, Math.round(width * 0.0045))}px`;
  ctx.fillText(formatJapaneseDate(date), side, panelY + panelHeight * 0.76);

  ctx.textAlign = 'right';
  ctx.font = `700 ${Math.round(width * 0.022)}px "Hiragino Sans", sans-serif`;
  ctx.fillText('湯気の向こう、日暮里の日常へ。', width - side, panelY + panelHeight * 0.76);
  ctx.restore();
}

function drawFrame(ctx: CanvasRenderingContext2D, width: number, height: number, palette: typeof PALETTES.noren, size: SizeKey): void {
  const inset = width * (size === 'story' ? 0.035 : 0.044);
  ctx.save();
  ctx.strokeStyle = palette.paper;
  ctx.globalAlpha = 0.72;
  ctx.lineWidth = Math.max(3, width * 0.004);
  roundedRect(ctx, inset, inset, width - inset * 2, height - inset * 2, width * 0.022);
  ctx.stroke();
  ctx.restore();
}

export function initMemoryCardStudio(): void {
  const canvas = document.getElementById('memory-canvas') as HTMLCanvasElement | null;
  if (!canvas || canvas.dataset.initialized === 'true') return;
  canvas.dataset.initialized = 'true';

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const fileInput = requiredElement<HTMLInputElement>('memory-file');
  const fileName = requiredElement<HTMLParagraphElement>('memory-file-name');
  const styleSelect = requiredElement<HTMLSelectElement>('memory-style');
  const titleInput = requiredElement<HTMLInputElement>('memory-title');
  const dateInput = requiredElement<HTMLInputElement>('memory-date');
  const zoomInput = requiredElement<HTMLInputElement>('memory-zoom');
  const offsetInput = requiredElement<HTMLInputElement>('memory-offset');
  const zoomValue = requiredElement<HTMLOutputElement>('memory-zoom-value');
  const offsetValue = requiredElement<HTMLOutputElement>('memory-offset-value');
  const downloadButton = requiredElement<HTMLButtonElement>('memory-download');
  const resetButton = requiredElement<HTMLButtonElement>('memory-reset');
  const status = requiredElement<HTMLParagraphElement>('memory-status');

  let loadedImage: LoadedImage | null = null;

  const today = new Date();
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
  dateInput.value = localDate;

  const selectedSize = (): SizeKey => {
    const selected = document.querySelector<HTMLInputElement>('input[name="memory-size"]:checked');
    return (selected?.value ?? 'square') as SizeKey;
  };

  const draw = (): void => {
    const sizeKey = selectedSize();
    const { width, height } = CARD_SIZES[sizeKey];
    const style = styleSelect.value as StyleKey;
    const palette = PALETTES[style] ?? PALETTES.noren;
    const zoom = Number(zoomInput.value);
    const offset = Number(offsetInput.value);

    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    if (loadedImage) {
      drawCoverImage(ctx, loadedImage, width, height, zoom, offset);
    } else {
      drawPlaceholder(ctx, width, height, palette);
    }

    if (style === 'noren') {
      const wash = ctx.createLinearGradient(0, 0, width, height);
      wash.addColorStop(0, 'rgba(16,40,69,.20)');
      wash.addColorStop(1, 'rgba(4,14,27,.40)');
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, width, height);
      drawSteam(ctx, width, height, palette.paper, 0.20);
    } else if (style === 'steam') {
      ctx.fillStyle = 'rgba(220,241,240,.13)';
      ctx.fillRect(0, 0, width, height);
      drawSteam(ctx, width, height, '#ffffff', 0.44);
    } else if (style === 'sunset') {
      const wash = ctx.createLinearGradient(0, 0, 0, height);
      wash.addColorStop(0, 'rgba(60,49,83,.12)');
      wash.addColorStop(0.62, 'rgba(201,107,75,.10)');
      wash.addColorStop(1, 'rgba(35,23,44,.42)');
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.fillStyle = 'rgba(23,57,87,.18)';
      ctx.fillRect(0, 0, width, height);
      drawTilePattern(ctx, width, height, palette);
    }

    drawTopMark(ctx, width, height, palette);
    drawCaption(ctx, width, height, titleInput.value.trim(), dateInput.value, palette, style, sizeKey);
    drawFrame(ctx, width, height, palette, sizeKey);
  };

  document.querySelectorAll<HTMLButtonElement>('[data-photo-source]').forEach((button) => {
    button.addEventListener('click', () => {
      const source = button.dataset.photoSource;
      if (source === 'album') {
        fileInput.removeAttribute('capture');
      } else {
        fileInput.setAttribute('capture', source === 'user' ? 'user' : 'environment');
      }
      fileInput.click();
    });
  });

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      status.textContent = '画像ファイルを選んでください。';
      return;
    }

    status.textContent = '画像を端末内で読み込んでいます…';
    try {
      if (loadedImage instanceof ImageBitmap) loadedImage.close();
      loadedImage = await decodeImage(file);
      fileName.textContent = `${file.name}（${Math.max(0.1, file.size / 1024 / 1024).toFixed(1)} MB）`;
      status.textContent = '画像を読み込みました。サーバーには送信されていません。';
      draw();
    } catch (error) {
      console.error(error);
      status.textContent = 'この画像を読み込めませんでした。JPEG、PNG、WebPをお試しください。';
    }
  });

  document.querySelectorAll<HTMLInputElement>('input[name="memory-size"]').forEach((input) => {
    input.addEventListener('change', draw);
  });

  [styleSelect, titleInput, dateInput].forEach((input) => {
    input.addEventListener('input', draw);
    input.addEventListener('change', draw);
  });

  zoomInput.addEventListener('input', () => {
    zoomValue.textContent = `${zoomInput.value}%`;
    draw();
  });

  offsetInput.addEventListener('input', () => {
    const value = Number(offsetInput.value);
    offsetValue.textContent = value === 0 ? '中央' : value < 0 ? `上へ ${Math.abs(value)}` : `下へ ${value}`;
    draw();
  });

  downloadButton.addEventListener('click', () => {
    status.textContent = 'PNG画像を端末内で生成しています…';
    canvas.toBlob((blob) => {
      if (!blob) {
        status.textContent = '画像を生成できませんでした。もう一度お試しください。';
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nippori-saito-yu-${dateInput.value || localDate}.png`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      status.textContent = 'PNG画像を保存しました。';
    }, 'image/png');
  });

  resetButton.addEventListener('click', () => {
    if (loadedImage instanceof ImageBitmap) loadedImage.close();
    loadedImage = null;
    fileInput.value = '';
    fileName.textContent = '写真を選ぶと、ここにファイル名が表示されます。';
    titleInput.value = '日暮里 斉藤湯';
    dateInput.value = localDate;
    styleSelect.value = 'noren';
    zoomInput.value = '100';
    offsetInput.value = '0';
    zoomValue.textContent = '100%';
    offsetValue.textContent = '中央';
    const square = document.querySelector<HTMLInputElement>('input[name="memory-size"][value="square"]');
    if (square) square.checked = true;
    status.textContent = '初期状態に戻しました。';
    draw();
  });

  draw();
}
