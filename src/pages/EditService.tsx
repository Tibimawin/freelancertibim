import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ServicesService } from '@/services/servicesService';
import { ServiceListing } from '@/types/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

export default function EditServicePage() {
  const { id } = useParams();
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState<ServiceListing | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('KZ');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [tagsInput, setTagsInput] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [subcategory, setSubcategory] = useState<string>('');
  const [deliveryTime, setDeliveryTime] = useState<string>('');
  const [includedText, setIncludedText] = useState<string>('');
  const [excludedText, setExcludedText] = useState<string>('');
  const [requirementsText, setRequirementsText] = useState<string>('');
  const [revisionsIncluded, setRevisionsIncluded] = useState<number>(0);
  const [terms, setTerms] = useState<string>('');
  const [portfolioUrl, setPortfolioUrl] = useState<string>('');
  const [availability, setAvailability] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id) return;
      setLoading(true);
      try {
        const item = await ServicesService.get(id);
        setListing(item);
        if (!item) {
          setError('Serviço não encontrado.');
          return;
        }
        // Ownership check
        if (!currentUser || item.sellerId !== currentUser.uid) {
          setError('Você não tem permissão para editar este serviço.');
          return;
        }
        // Prefill
        setTitle(item.title || '');
        setDescription(item.description || '');
        setPrice(item.price || 0);
        setCurrency(item.currency || 'KZ');
        setImageUrl(item.imageUrl || '');
        setTagsInput((item.tags || []).join(', '));
        setCategory(item.category || '');
        setSubcategory(item.subcategory || '');
        setDeliveryTime(item.deliveryTime || '');
        setIncludedText((item.includedItems || []).join('\n'));
        setExcludedText((item.excludedItems || []).join('\n'));
        setRequirementsText((item.clientRequirements || []).join('\n'));
        setRevisionsIncluded(item.revisionsIncluded || 0);
        setTerms(item.terms || '');
        setPortfolioUrl(item.portfolioUrl || '');
        setAvailability(item.availability || '');
      } catch (e) {
        setError('Erro ao carregar serviço.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, currentUser?.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError(null);
    setSubmitting(true);
    try {
      const includedItems = includedText.split('\n').map((l) => l.trim()).filter(Boolean);
      const excludedItems = excludedText.split('\n').map((l) => l.trim()).filter(Boolean);
      const clientRequirements = requirementsText.split('\n').map((l) => l.trim()).filter(Boolean);
      await ServicesService.update(id, {
        title,
        description,
        imageUrl: imageUrl || undefined,
        tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
        sellerId: currentUser!.uid,
        sellerName: userData?.name || currentUser!.displayName || 'Usuário',
        price: Number(price) || 0,
        currency: currency || 'KZ',
        category: category || undefined,
        subcategory: subcategory || undefined,
        deliveryTime: deliveryTime || undefined,
        includedItems,
        excludedItems,
        clientRequirements,
        revisionsIncluded: Number(revisionsIncluded) || 0,
        terms: terms || undefined,
        portfolioUrl: portfolioUrl || undefined,
        availability: availability || undefined,
      });
      navigate(`/services/${id}`);
    } catch (e: any) {
      setError('Não foi possível salvar as alterações.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-10">
        <Alert>
          <AlertTitle>Entre para editar serviços</AlertTitle>
          <AlertDescription>
            Você precisa estar autenticado para editar seu serviço.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Carregando serviço…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Não autorizado</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild variant="outline"><Link to="/services">Voltar aos serviços</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-10">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Editar Serviço</h1>
          <p className="text-sm text-muted-foreground mt-1">Atualize as informações do seu serviço.</p>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Serviço</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium">Preço</label>
                  <Input type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} required />
                </div>
                <div>
                  <label className="text-sm font-medium">Moeda</label>
                  <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Imagem (URL)</label>
                  <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Categoria</label>
                  <Input value={category} onChange={(e) => setCategory(e.target.value)} required />
                </div>
                <div>
                  <label className="text-sm font-medium">Subcategoria</label>
                  <Input value={subcategory} onChange={(e) => setSubcategory(e.target.value)} required />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Prazo de Entrega</label>
                <Input value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium">O Que Está Incluído</label>
                <Textarea value={includedText} onChange={(e) => setIncludedText(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium">O Que Não Está Incluído</label>
                <Textarea value={excludedText} onChange={(e) => setExcludedText(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium">Requisitos do Cliente</label>
                <Textarea value={requirementsText} onChange={(e) => setRequirementsText(e.target.value)} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Revisões Inclusas</label>
                  <Input type="number" min={0} value={revisionsIncluded} onChange={(e) => setRevisionsIncluded(Number(e.target.value))} required />
                </div>
                <div>
                  <label className="text-sm font-medium">Portfólio/Exemplos (opcional)</label>
                  <Input value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Termos e Condições</label>
                <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium">Disponibilidade</label>
                <Textarea value={availability} onChange={(e) => setAvailability(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium">Tags (separadas por vírgula)</label>
                <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
                <div className="mt-2 flex gap-2 flex-wrap">
                  {tagsInput.split(',').map((t) => t.trim()).filter(Boolean).map((t) => (
                    <Badge key={t} variant="outline">{t}</Badge>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => navigate(`/services/${id}`)}>Cancelar</Button>
                <Button type="submit" disabled={submitting} className="glow-effect">
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Salvar alterações
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}