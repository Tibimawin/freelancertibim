import React, { useEffect, useState } from 'react';
import { ServiceListing } from '@/types/firebase';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AuthService } from '@/services/auth';
import { formatKz } from '@/lib/currency';

type Props = {
  listing: ServiceListing;
  variant?: 'grid' | 'list';
};

export const ServiceCard: React.FC<Props> = ({ listing, variant = 'grid' }) => {
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
        console.warn('Falha ao buscar avatar do vendedor (service card):', e);
        if (mounted) setSellerAvatarUrl(null);
      }
    };
    load();
    return () => { mounted = false; };
  }, [listing.sellerId]);

  if (variant === 'list') {
    return (
      <Card className="overflow-hidden group card-hover animate-fade-in relative">
        <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500" />
        <CardContent className="p-4 relative z-10">
          <div className="flex items-center gap-4">
            <Link to={`/services/${listing.id}`} className="block group-hover:scale-105 transition-transform duration-300">
              <div className="w-28 h-24 rounded bg-muted/30 overflow-hidden shadow-sm group-hover:shadow-md transition-shadow duration-300">
                {imageSrc ? (
                  <img src={imageSrc} alt={listing.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" decoding="async" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">Sem imagem</div>
                )}
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/services/${listing.id}`} className="block">
                <div className="font-semibold truncate hover:underline group-hover:text-primary transition-colors duration-300">{listing.title}</div>
              </Link>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1 group-hover:text-warning transition-colors duration-300">
                  <Star size={14} className="text-warning group-hover:scale-110 transition-transform duration-300" />
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
                {(listing.tags || []).slice(0, 3).map((t) => (
                  <Badge key={t} variant="secondary">{t}</Badge>
                ))}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-foreground balance-display group-hover:scale-110 transition-transform duration-300 origin-right">{formatKz(listing.price)}</div>
              <Link to={`/services/${listing.id}`} className="text-sm font-medium text-primary hover:underline transition-all duration-300 group-hover:translate-x-1 inline-block">Ver detalhes →</Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden group card-hover animate-fade-in relative">
      <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500" />
      <CardContent className="p-0 relative z-10">
        <Link to={`/services/${listing.id}`} className="block overflow-hidden">
          <div className="relative w-full h-56 bg-muted/30 overflow-hidden">
            {imageSrc ? (
              <img src={imageSrc} alt={listing.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" decoding="async" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">Sem imagem</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </Link>
        <div className="p-4 space-y-2">
          <div className="flex gap-2 flex-wrap animate-scale-in">
            {(listing.tags || []).slice(0, 3).map((t) => (
              <Badge key={t} variant="secondary" className="transition-all duration-300 group-hover:bg-primary/20 group-hover:text-primary">{t}</Badge>
            ))}
          </div>
          <Link to={`/services/${listing.id}`} className="block">
            <div className="font-semibold truncate hover:underline group-hover:text-primary transition-colors duration-300">{listing.title}</div>
          </Link>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1 group-hover:text-warning transition-colors duration-300">
              <Star size={14} className="text-warning group-hover:scale-110 transition-transform duration-300" />
              <span>{(listing.rating ?? 0).toFixed(1)}</span>
              <span>({listing.ratingCount ?? 0} avaliações)</span>
            </div>
            <div className="font-semibold text-foreground balance-display group-hover:scale-110 transition-transform duration-300 origin-right">{formatKz(listing.price)}</div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground group-hover:text-foreground transition-colors duration-300">
              <Avatar className="h-6 w-6 group-hover:scale-110 transition-transform duration-300">
                <AvatarImage src={sellerAvatarUrl || undefined} />
                <AvatarFallback>{(listing.sellerName || '?').charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="truncate">{listing.sellerName}</span>
            </div>
            <Link to={`/services/${listing.id}`} className="text-sm font-medium text-primary hover:underline transition-all duration-300 group-hover:translate-x-1 inline-block">Ver detalhes →</Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceCard;
