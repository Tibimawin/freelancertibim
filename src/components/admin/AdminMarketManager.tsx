import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { MarketListing } from '@/types/firebase';
import { MarketService } from '@/services/marketService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const AdminMarketManager: React.FC = () => {
  const labelDigitalCategory = (c: 'ebook' | 'video_course' | 'app' | 'other') => {
    switch (c) {
      case 'ebook': return 'eBook';
      case 'video_course': return 'Curso em Vídeo';
      case 'app': return 'Aplicativo';
      default: return 'Outro';
    }
  };
  const { currentUser, userData } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState<string[]>(['', '', '', '', '']);
  const [tagsText, setTagsText] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [currency, setCurrency] = useState('KZ');
  const [category, setCategory] = useState<string>('');
  const [subcategory, setSubcategory] = useState<string>('');
  const [brand, setBrand] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [condition, setCondition] = useState<'new' | 'used' | 'refurbished' | ''>('');
  const [sku, setSku] = useState<string>('');
  const [stock, setStock] = useState<number>(0);
  const [warranty, setWarranty] = useState<string>('');
  const [deliveryInfo, setDeliveryInfo] = useState<string>('');
  const [returnPolicy, setReturnPolicy] = useState<string>('');
  const [details, setDetails] = useState<string>('');
  // Campos digitais
  const [productType, setProductType] = useState<'digital' | 'physical' | 'service' | ''>('');
  const [digitalCategory, setDigitalCategory] = useState<'ebook' | 'video_course' | 'app' | 'other' | ''>('');
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [autoDeliver, setAutoDeliver] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sellerId = currentUser?.uid || 'platform';
  const sellerName = userData?.name || 'Plataforma';

  const fetchListings = async () => {
    try {
      setLoadingList(true);
      const data = await MarketService.listListings({ limitNum: 10 });
      setListings(data);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !price) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha título, descrição e preço.' });
      return;
    }
    const tags = tagsText
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
    setSubmitting(true);
    try {
      const imgs = images.filter((u) => !!u).slice(0, 5);
      if (editingId) {
        await MarketService.updateListing(editingId, {
          title,
          description,
          imageUrl: imageUrl,
          images: imgs,
          tags,
          price: Number(price),
          currency,
          category: category,
          subcategory: subcategory,
          brand: brand,
          model: model,
          condition: condition,
          sku: sku,
          stock: Number(stock),
          warranty: warranty,
          deliveryInfo: deliveryInfo,
          returnPolicy: returnPolicy,
          details: details,
          productType: productType || undefined,
          digitalCategory: productType === 'digital' ? (digitalCategory || 'ebook') : undefined,
          downloadUrl: productType === 'digital' ? (downloadUrl || '') : undefined,
          autoDeliver: productType === 'digital' ? !!autoDeliver : undefined,
        });
        toast({ title: 'Produto atualizado', description: 'As alterações foram salvas com sucesso.' });
      } else {
        await MarketService.createListing({
          title,
          description,
          imageUrl: imageUrl,
          images: imgs,
          tags,
          sellerId,
          sellerName,
          price: Number(price),
          currency,
          category: category,
          subcategory: subcategory,
          brand: brand,
          model: model,
          condition: condition,
          sku: sku,
          stock: Number(stock),
          warranty: warranty,
          deliveryInfo: deliveryInfo,
          returnPolicy: returnPolicy,
          details: details,
          productType: productType || undefined,
          digitalCategory: productType === 'digital' ? (digitalCategory || 'ebook') : undefined,
          downloadUrl: productType === 'digital' ? (downloadUrl || '') : undefined,
          autoDeliver: productType === 'digital' ? !!autoDeliver : undefined,
        });
        toast({ title: 'Produto criado', description: 'O produto do Mercado foi adicionado com sucesso.' });
      }
      // Limpar formulário e atualizar lista
      setTitle('');
      setDescription('');
      setImageUrl('');
      setImages(['', '', '', '', '']);
      setTagsText('');
      setPrice(0);
  setCurrency('KZ');
      setCategory('');
      setSubcategory('');
      setBrand('');
      setModel('');
      setCondition('');
      setSku('');
      setStock(0);
      setWarranty('');
      setDeliveryInfo('');
      setReturnPolicy('');
      setDetails('');
      setProductType('');
      setDigitalCategory('');
      setDownloadUrl('');
      setAutoDeliver(true);
      setEditingId(null);
      await fetchListings();
    } catch (err: any) {
      toast({ title: editingId ? 'Erro ao atualizar' : 'Erro ao criar', description: err?.message || 'Falha ao salvar produto.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (l: MarketListing) => {
    setEditingId(l.id);
    setTitle(l.title || '');
    setDescription(l.description || '');
    setImageUrl(l.imageUrl || '');
    const imgs = (l.images || []);
    const padded = [...imgs, '', '', '', ''].slice(0, 5);
    setImages(padded);
    setTagsText((l.tags || []).join(', '));
    setPrice(Number(l.price) || 0);
  setCurrency(l.currency || 'KZ');
    setCategory(l.category || '');
    setSubcategory(l.subcategory || '');
    setBrand(l.brand || '');
    setModel(l.model || '');
    setCondition((l.condition as any) || '');
    setSku(l.sku || '');
    setStock(Number(l.stock) || 0);
    setWarranty(l.warranty || '');
    setDeliveryInfo(l.deliveryInfo || '');
    setReturnPolicy(l.returnPolicy || '');
    setDetails(l.details || '');
    setProductType((l.productType as any) || '');
    setDigitalCategory((l.digitalCategory as any) || '');
    setDownloadUrl(l.downloadUrl || '');
    setAutoDeliver(l.autoDeliver ?? true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setImageUrl('');
    setImages(['', '', '', '', '']);
    setTagsText('');
    setPrice(0);
  setCurrency('KZ');
    setCategory('');
    setSubcategory('');
    setBrand('');
    setModel('');
    setCondition('');
    setSku('');
    setStock(0);
    setWarranty('');
    setDeliveryInfo('');
    setReturnPolicy('');
    setDetails('');
  };

  const filteredListings = useMemo(() => {
    const s = searchTerm.trim().toLowerCase();
    if (!s) return listings;
    return listings.filter((l) => {
      const title = (l.title || '').toLowerCase();
      const desc = (l.description || '').toLowerCase();
      const tags = (l.tags || []).join(', ').toLowerCase();
      return title.includes(s) || desc.includes(s) || tags.includes(s);
    });
  }, [listings, searchTerm]);

  const handleDelete = async (l: MarketListing) => {
    const ok = window.confirm(`Tem certeza que deseja excluir "${l.title}"? Esta ação é permanente.`);
    if (!ok) return;
    try {
      setDeletingId(l.id!);
      await MarketService.deleteListing(l.id!);
      toast({ title: 'Produto excluído', description: 'O produto foi removido com sucesso.' });
      await fetchListings();
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err?.message || 'Falha ao excluir produto.', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Criar Produto do Mercado</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {editingId && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                <div className="text-sm text-amber-800">Editando produto existente</div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Título</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Backlinks Premium" />
              </div>
              <div>
  <Label>Preço (Kz)</Label>
                <Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} min={0} step={1} />
              </div>
            </div>

            {/* Tipo de produto */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Tipo de produto</Label>
                <Select value={productType} onValueChange={(v) => setProductType(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="digital">Digital</SelectItem>
                    <SelectItem value="physical">Físico</SelectItem>
                    <SelectItem value="service">Serviço</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {productType === 'digital' && (
                <div>
                  <Label>Categoria digital</Label>
                  <Select value={digitalCategory} onValueChange={(v) => setDigitalCategory(v as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ebook">eBook</SelectItem>
                      <SelectItem value="video_course">Curso em Vídeo</SelectItem>
                      <SelectItem value="app">Aplicativo</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {productType === 'digital' && (
                <div>
                  <Label>Link do produto (download)</Label>
                  <Input value={downloadUrl} onChange={(e) => setDownloadUrl(e.target.value)} placeholder="https://link-para-download" />
                </div>
              )}
            </div>
            {productType === 'digital' && (
              <div className="flex items-center gap-2">
                <Checkbox id="autoDeliver" checked={autoDeliver} onCheckedChange={(v) => setAutoDeliver(!!v)} />
                <Label htmlFor="autoDeliver">Entrega automática (download imediato após compra)</Label>
              </div>
            )}
            <div>
              <Label>Descrição</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhe o produto, benefícios e escopo." />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Imagem (URL opcional)</Label>
                <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <Label>Tags (separadas por vírgula)</Label>
                <Input value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="SEO, Backlinks, Marketing" />
              </div>
            </div>
            <Separator className="my-2" />
            <div className="space-y-2">
              <Label>Imagens adicionais (até 5)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {images.map((url, idx) => (
                  <Input
                    key={idx}
                    value={url}
                    onChange={(e) => {
                      const next = [...images];
                      next[idx] = e.target.value;
                      setImages(next);
                    }}
                    placeholder={`URL da imagem ${idx + 1}`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Use URLs diretas ou seu CDN (ex.: Cloudinary). A primeira imagem será destacada.</p>
            </div>
            
            <Separator className="my-2" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Categoria</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Marketing Digital">Marketing Digital</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Desenvolvimento Web">Desenvolvimento Web</SelectItem>
                    <SelectItem value="Mídias Sociais">Mídias Sociais</SelectItem>
                    <SelectItem value="SEO">SEO</SelectItem>
                    <SelectItem value="E-commerce">E-commerce</SelectItem>
                    <SelectItem value="Análises">Análises</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subcategoria</Label>
                <Input value={subcategory} onChange={(e) => setSubcategory(e.target.value)} placeholder="Ex.: Backlinks, Landing Pages" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Marca</Label>
                <Input value={brand} onChange={(e) => setBrand(e.target.value)} />
              </div>
              <div>
                <Label>Modelo</Label>
                <Input value={model} onChange={(e) => setModel(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Condição</Label>
                <Select value={condition} onValueChange={(v) => setCondition(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Novo</SelectItem>
                    <SelectItem value="used">Usado</SelectItem>
                    <SelectItem value="refurbished">Recondicionado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>SKU</Label>
                <Input value={sku} onChange={(e) => setSku(e.target.value)} />
              </div>
              <div>
                <Label>Estoque</Label>
                <Input type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Garantia</Label>
                <Input value={warranty} onChange={(e) => setWarranty(e.target.value)} placeholder="Ex.: 90 dias" />
              </div>
              <div>
                <Label>Entrega</Label>
                <Input value={deliveryInfo} onChange={(e) => setDeliveryInfo(e.target.value)} placeholder="Ex.: Entrega digital imediata" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Política de devolução</Label>
                <Input value={returnPolicy} onChange={(e) => setReturnPolicy(e.target.value)} placeholder="Ex.: 7 dias para reembolso" />
              </div>
              <div>
                <Label>Detalhes / Especificações</Label>
                <Textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Características técnicas, escopo, requisitos..." />
              </div>
            </div>
            <Separator className="my-2" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Moeda</Label>
                <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
              </div>
              <div>
                <Label>Vendedor</Label>
                <Input value={`${sellerName} (${sellerId})`} readOnly />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              {editingId && (
                <Button type="button" variant="secondary" onClick={cancelEdit} disabled={submitting}>
                  Cancelar edição
                </Button>
              )}
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</>
                ) : (
                  editingId ? 'Salvar alterações' : 'Criar Produto'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Produtos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por título, descrição ou tags"
            />
          </div>
          {loadingList ? (
            <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Carregando...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredListings.map((l) => (
                <div key={l.id} className="border rounded-lg p-3">
                  <div className="font-medium">{l.title}</div>
                  <div className="text-xs text-muted-foreground mb-1">{l.sellerName} • {l.price} {l.currency}</div>
                  {(l.productType || l.digitalCategory) && (
                    <div className="text-xs mb-1">
                      <span className="inline-flex items-center rounded bg-muted px-2 py-0.5">
                        Tipo: {l.productType || '—'}{l.productType === 'digital' && l.digitalCategory ? ` (${labelDigitalCategory(l.digitalCategory as any)})` : ''}
                      </span>
                    </div>
                  )}
                  <div className="text-sm line-clamp-3">{l.description}</div>
                  {l.tags?.length ? (
                    <div className="mt-2 text-xs text-muted-foreground">Tags: {l.tags.join(', ')}</div>
                  ) : null}
                  <div className="mt-3 flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(l)}>Editar</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(l)} disabled={deletingId === l.id}>
                      {deletingId === l.id ? 'Excluindo...' : 'Excluir'}
                    </Button>
                  </div>
                </div>
              ))}
              {filteredListings.length === 0 && (
                <div className="text-sm text-muted-foreground">Nenhum produto cadastrado ainda.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMarketManager;