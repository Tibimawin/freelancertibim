import React, { useEffect, useState } from 'react';
import { MarketListing } from '@/types/firebase';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AuthService } from '@/services/auth';

type Props = {
  listing: MarketListing;
  variant?: 'grid' | 'list';
};

const formatPrice = (value: number, currency: string) => {
  const iso = currency === 'KZ' ? 'AOA' : currency;
  try {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: iso }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
};

export const MarketCard: React.FC<Props> = ({ listing, variant = 'grid' }) => {
  const imageSrc = (listing.images && listing.images.length > 0 ? listing.images[0] : undefined) || listing.imageUrl;
  const [sellerAvatarUrl, setSellerAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (listing.sellerId) {
          const seller = await AuthService.getUserData(listing.sellerId);
          if (mounted) setSellerAvatarUrl(seller?.avatarUrl || null);
        } else {
          if (mounted) setSellerAvatarUrl(null);
        }
      } catch (e) {
        console.warn('Falha ao buscar avatar do vendedor (card):', e);
        if (mounted) setSellerAvatarUrl(null);
      }
    };
    load();
    return () => { mounted = false; };
  }, [listing.sellerId]);
  if (variant === 'list') {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Link to={`/market/${listing.id}`} className="block">
              <div className="w-28 h-24 rounded bg-muted/30 overflow-hidden">
                {imageSrc ? (
                  <img src={imageSrc} alt={listing.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">Sem imagem</div>
                )}
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/market/${listing.id}`} className="block">
                <div className="font-semibold truncate hover:underline">{listing.title}</div>
              </Link>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-yellow-400" />
                  <span>{(listing.rating ?? 0).toFixed(1)}</span>
                  <span>({listing.ratingCount ?? 0})</span>
                </div>
                <span className="hidden sm:inline">•</span>
                <div className="flex items-center gap-2 truncate">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={sellerAvatarUrl || undefined} />
                    <AvatarFallback>{(listing.sellerName || '?').charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="truncate">{listing.sellerName}</span>
                </div>
              </div>
              <div className="mt-2 flex gap-2 flex-wrap">
                {listing.tags?.slice(0, 3).map((t) => (
                  <Badge key={t} variant="secondary">{t}</Badge>
                ))}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-foreground">{formatPrice(listing.price, listing.currency)}</div>
              <Link to={`/market/${listing.id}`} className="text-sm font-medium hover:underline">Ver detalhes</Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <Link to={`/market/${listing.id}`} className="block">
          <div className="relative w-full h-56 bg-muted/30 overflow-hidden">
            {imageSrc ? (
              <img src={imageSrc} alt={listing.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">Sem imagem</div>
            )}
          </div>
        </Link>
        <div className="p-4 space-y-2">
          <div className="flex gap-2 flex-wrap">
            {listing.tags?.slice(0, 3).map((t) => (
              <Badge key={t} variant="secondary">{t}</Badge>
            ))}
          </div>
          <Link to={`/market/${listing.id}`} className="block">
            <div className="font-semibold truncate hover:underline">{listing.title}</div>
          </Link>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star size={14} className="text-yellow-400" />
              <span>{(listing.rating ?? 0).toFixed(1)}</span>
              <span>({listing.ratingCount ?? 0} avaliações)</span>
            </div>
            <div className="font-semibold text-foreground">{formatPrice(listing.price, listing.currency)}</div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Avatar className="h-6 w-6">
                <AvatarImage src={sellerAvatarUrl || undefined} />
                <AvatarFallback>{(listing.sellerName || '?').charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="truncate">{listing.sellerName}</span>
            </div>
            <Link to={`/market/${listing.id}`} className="text-sm font-medium hover:underline">Ver detalhes</Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketCard;