import { rtdb } from '@/lib/firebase';
import { get, ref } from 'firebase/database';

const FALLBACK_AVATARS: string[] = [
  'https://i.pinimg.com/1200x/64/06/5f/64065f69a053bf9692847f589b586b75.jpg',
  'https://i.pinimg.com/1200x/69/01/e7/6901e799de424e8e428f09bd1fd4af13.jpg',
  'https://i.pinimg.com/1200x/53/bf/86/53bf8613b2d9396a1a4ed8917e18df7f.jpg',
  'https://i.pinimg.com/1200x/c3/b0/9e/c3b09ec469da487a665ad8b8be1899ca.jpg',
  // Nota: URL de página do Pinterest não é imagem direta; preferível usar CDN pinimg
];

export const AvatarService = {
  async getDefaultAvatars(): Promise<string[]> {
    try {
      const snap = await get(ref(rtdb, 'default_avatars'));
      const val = snap.val();
      if (!val) return FALLBACK_AVATARS;
      if (Array.isArray(val)) return val.filter(Boolean);
      if (typeof val === 'object') return (Object.values(val) as string[]).filter(Boolean);
      return FALLBACK_AVATARS;
    } catch (e) {
      console.warn('Falha ao carregar avatares padrão do RTDB, usando fallback', e);
      return FALLBACK_AVATARS;
    }
  },
};

export default AvatarService;