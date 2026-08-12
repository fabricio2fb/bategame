export const PRESET_AVATARS = [
  { name: 'Azul', src: '/avatar-game/azul.png' },
  { name: 'Amarelo', src: '/avatar-game/amarelo.png' },
  { name: 'Verde', src: '/avatar-game/verde.png' },
] as const;

export const DEFAULT_AVATAR = PRESET_AVATARS[0].src;
const AVATAR_MAX_BYTES = 300_000;
const AVATAR_MAX_DIMENSION = 1024;

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function getFallbackAvatarColor(name: string): string {
  const colors = ['#3B82F6', '#22C55E', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
  return colors[Math.max(0, name.length) % colors.length];
}

export function saveStoredAvatarUrl(avatarUrl: string | null): void {
  void avatarUrl;
}

export function getStoredAvatarUrl(): string | undefined {
  return undefined;
}

export async function readAvatarFile(file: File): Promise<string> {
  if (file.size <= 0 || file.size > AVATAR_MAX_BYTES) {
    throw new Error('Imagem deve ter ate 300 KB.');
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!detectSafeRasterFormat(bytes)) {
    throw new Error('Use PNG, JPG ou WEBP.');
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Nao foi possivel ler a imagem.'));
    reader.onload = () => {
      const source = typeof reader.result === 'string' ? reader.result : '';
      if (!source) {
        reject(new Error('Imagem invalida.'));
        return;
      }

      image.onload = () => {
        if (image.width > AVATAR_MAX_DIMENSION || image.height > AVATAR_MAX_DIMENSION) {
          reject(new Error('Imagem muito grande.'));
          return;
        }

        const size = 256;
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) {
          resolve(source);
          return;
        }

        canvas.width = size;
        canvas.height = size;
        const scale = Math.max(size / image.width, size / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        const x = (size - width) / 2;
        const y = (size - height) / 2;
        context.drawImage(image, x, y, width, height);
        resolve(canvas.toDataURL('image/webp', 0.78));
      };
      image.onerror = () => reject(new Error('Imagem invalida.'));
      image.src = source;
    };

    reader.readAsDataURL(file);
  });
}

function detectSafeRasterFormat(bytes: Uint8Array): 'png' | 'jpeg' | 'webp' | null {
  if (bytes.length >= 24 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) {
    return 'png';
  }
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9) {
    return 'jpeg';
  }
  if (bytes.length >= 30 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP') {
    return 'webp';
  }
  return null;
}

function ascii(bytes: Uint8Array, start: number, end: number): string {
  return String.fromCharCode(...bytes.slice(start, end));
}
