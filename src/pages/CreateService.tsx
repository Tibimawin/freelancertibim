import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ServicesService } from '@/services/servicesService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function CreateServicePage() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('KZ');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imagesText, setImagesText] = useState<string>(''); // uma por linha
  const [imageCaptionsText, setImageCaptionsText] = useState<string>(''); // uma por linha
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([]);
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
  const [error, setError] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-10">
        <Alert>
          <AlertTitle>Entre para criar serviços</AlertTitle>
          <AlertDescription>
            Você precisa estar autenticado para criar seu serviço.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const includedItems = includedText.split('\n').map((l) => l.trim()).filter(Boolean);
      const excludedItems = excludedText.split('\n').map((l) => l.trim()).filter(Boolean);
      const clientRequirements = requirementsText.split('\n').map((l) => l.trim()).filter(Boolean);
      const images = imagesText.split('\n').map((l) => l.trim()).filter(Boolean);
      const imageCaptions = imageCaptionsText.split('\n').map((l) => l.trim());
      const faqsClean = faqs
        .map(f => ({ question: f.question.trim(), answer: f.answer.trim() }))
        .filter(f => f.question || f.answer);

      // alinhar número de legendas ao número de imagens (corta excesso)
      const alignedCaptions = imageCaptions.slice(0, Math.max(0, images.length));
      const id = await ServicesService.create({
        title,
        description,
        imageUrl: images.length === 0 ? (imageUrl || undefined) : undefined,
        images: images.length > 0 ? images : undefined,
        imageCaptions: alignedCaptions.length > 0 ? alignedCaptions : undefined,
        tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
        sellerId: currentUser.uid,
        sellerName: userData?.name || currentUser.displayName || 'Usuário',
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
        faqs: faqsClean.length > 0 ? faqsClean : undefined,
      });
      navigate(`/services/${id}`);
    } catch (e: any) {
      setError('Não foi possível criar o serviço.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Criar Serviço</h1>
              <p className="text-sm text-muted-foreground mt-1">Preencha as informações do seu serviço. Não é um marketplace.</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/services">Voltar para Serviços</Link>
            </Button>
          </div>
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
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Eu vou editar seus vídeos curtos" required />
              </div>

              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva claramente o que você oferece" required />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium">Preço</label>
                  <Input type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} required />
                </div>
                <div>
                  <label className="text-sm font-medium">Moeda</label>
                  <Input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="KZ" />
                </div>
                <div>
                  <label className="text-sm font-medium">Imagem (URL)</label>
                  <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Imagens da Galeria (uma por linha)</label>
                  <Textarea value={imagesText} onChange={(e) => setImagesText(e.target.value)} placeholder="https://img1.jpg\nhttps://img2.jpg" />
                </div>
                <div>
                  <label className="text-sm font-medium">Legendas (uma por linha)</label>
                  <Textarea value={imageCaptionsText} onChange={(e) => setImageCaptionsText(e.target.value)} placeholder="Antes\nDepois" />
                </div>
              </div>
              {(imagesText.split('\n').filter(l => l.trim()).length > 0) && (imageCaptionsText.split('\n').length !== imagesText.split('\n').filter(l => l.trim()).length) && (
                <p className="text-xs text-amber-600">Aviso: o número de legendas não corresponde ao número de imagens. As extras serão ignoradas.</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Categoria</label>
                  <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex.: Design" required />
                </div>
                <div>
                  <label className="text-sm font-medium">Subcategoria</label>
                  <Input value={subcategory} onChange={(e) => setSubcategory(e.target.value)} placeholder="Ex.: Social Media" required />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Prazo de Entrega</label>
                <Input value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} placeholder="Ex.: 2 dias úteis" required />
              </div>

              <div>
                <label className="text-sm font-medium">O Que Está Incluído</label>
                <Textarea value={includedText} onChange={(e) => setIncludedText(e.target.value)} placeholder="Uma linha por item (ex.: 1 banner, arquivo PNG, fonte utilizada)" required />
              </div>

              <div>
                <label className="text-sm font-medium">O Que Não Está Incluído</label>
                <Textarea value={excludedText} onChange={(e) => setExcludedText(e.target.value)} placeholder="Uma linha por item (ex.: fotos originais, criação de logotipo, tráfego pago)" required />
              </div>

              <div>
                <label className="text-sm font-medium">Requisitos do Cliente</label>
                <Textarea value={requirementsText} onChange={(e) => setRequirementsText(e.target.value)} placeholder="Uma linha por requisito (ex.: briefing, cores, exemplos)" required />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Revisões Inclusas</label>
                  <Input type="number" min={0} value={revisionsIncluded} onChange={(e) => setRevisionsIncluded(Number(e.target.value))} required />
                </div>
                <div>
                  <label className="text-sm font-medium">Portfólio/Exemplos (opcional)</label>
                  <Input value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://seuportfolio.com" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Termos e Condições</label>
                <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="Políticas de alterações, limites, reembolso" required />
              </div>

              <div>
                <label className="text-sm font-medium">Disponibilidade</label>
                <Textarea value={availability} onChange={(e) => setAvailability(e.target.value)} placeholder="Horários e tempo de resposta (ex.: 9h–18h, resposta em até 2h)" required />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Perguntas Frequentes (FAQs)</label>
                  <Button type="button" variant="outline" size="sm" onClick={() => setFaqs(prev => [...prev, { question: '', answer: '' }])}>Adicionar FAQ</Button>
                </div>
                <div className="space-y-3 mt-2">
                  {faqs.map((faq, idx) => (
                    <div key={idx} className="rounded-md border p-3 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-medium">Pergunta</label>
                          <Input value={faq.question} onChange={(e) => setFaqs(prev => prev.map((f,i) => i===idx ? { ...f, question: e.target.value } : f))} placeholder="Ex.: O que está incluído?" />
                        </div>
                        <div>
                          <label className="text-xs font-medium">Resposta</label>
                          <Input value={faq.answer} onChange={(e) => setFaqs(prev => prev.map((f,i) => i===idx ? { ...f, answer: e.target.value } : f))} placeholder="Detalhes sobre o item incluído" />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setFaqs(prev => {
                          const arr = [...prev];
                          if (idx > 0) [arr[idx-1], arr[idx]] = [arr[idx], arr[idx-1]];
                          return arr;
                        })}>Mover ↑</Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setFaqs(prev => {
                          const arr = [...prev];
                          if (idx < arr.length - 1) [arr[idx+1], arr[idx]] = [arr[idx], arr[idx+1]];
                          return arr;
                        })}>Mover ↓</Button>
                        <Button type="button" variant="destructive" size="sm" onClick={() => setFaqs(prev => prev.filter((_,i) => i!==idx))}>Remover</Button>
                      </div>
                    </div>
                  ))}
                  {faqs.length === 0 && (
                    <p className="text-xs text-muted-foreground">Adicione perguntas frequentes para ajudar clientes a entender o serviço.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Tags (separadas por vírgula)</label>
                <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="Vídeo, Design, Social" />
                <div className="mt-2 flex gap-2 flex-wrap">
                  {tagsInput.split(',').map((t) => t.trim()).filter(Boolean).map((t) => (
                    <Badge key={t} variant="outline">{t}</Badge>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => navigate('/services')}>Cancelar</Button>
                <Button type="submit" disabled={submitting} className="glow-effect">
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Criar Serviço
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}