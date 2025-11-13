import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Settings } from 'lucide-react';
import { TaxonomyService, NamedItem, SubcategoryItem, PaymentRangeItem } from '@/services/taxonomyService';
import { toast } from 'sonner';

const AdminTaxonomyManager = () => {
  const [jobLevels, setJobLevels] = useState<NamedItem[]>([]);
  const [categories, setCategories] = useState<NamedItem[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryItem[]>([]);
  const [locations, setLocations] = useState<NamedItem[]>([]);
  const [paymentRanges, setPaymentRanges] = useState<PaymentRangeItem[]>([]);
  const [statsLabels, setStatsLabels] = useState<NamedItem[]>([]);

  const [newLevel, setNewLevel] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newSubcategory, setNewSubcategory] = useState('');
  const [subcategoryCategory, setSubcategoryCategory] = useState<string>('');
  const [newLocation, setNewLocation] = useState('');
  const [newPaymentLabel, setNewPaymentLabel] = useState('');
  const [newPaymentMin, setNewPaymentMin] = useState<string>('');
  const [newPaymentMax, setNewPaymentMax] = useState<string>('');
  const [newStatsLabel, setNewStatsLabel] = useState('');

  const loadAll = async () => {
    try {
      const [levels, cats, subs, locs, ranges, stats] = await Promise.all([
        TaxonomyService.getJobLevels(),
        TaxonomyService.getCategories(),
        TaxonomyService.getSubcategories(),
        TaxonomyService.getLocations(),
        TaxonomyService.getPaymentRanges(),
        TaxonomyService.getStatsLabels(),
      ]);
      setJobLevels(levels);
      setCategories(cats);
      setSubcategories(subs);
      setLocations(locs);
      setPaymentRanges(ranges);
      setStatsLabels(stats);
    } catch (error) {
      console.error('Erro ao carregar taxonomias:', error);
      toast.error('Erro ao carregar listas do admin');
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const groupedSubcategories = useMemo(() => {
    const map: Record<string, SubcategoryItem[]> = {};
    subcategories.forEach((s) => {
      const key = s.category || '__sem_categoria__';
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return map;
  }, [subcategories]);

  // Actions
  const addLevel = async () => {
    const name = newLevel.trim();
    if (!name) return;
    try {
      await TaxonomyService.addJobLevel(name);
      setNewLevel('');
      toast.success('Nível adicionado');
      loadAll();
    } catch (e) {
      toast.error('Falha ao adicionar nível');
    }
  };
  const removeLevel = async (id: string) => {
    try {
      await TaxonomyService.deleteJobLevel(id);
      toast.success('Nível removido');
      loadAll();
    } catch {
      toast.error('Falha ao remover nível');
    }
  };

  const addCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    try {
      await TaxonomyService.addCategory(name);
      setNewCategory('');
      toast.success('Categoria adicionada');
      loadAll();
    } catch {
      toast.error('Falha ao adicionar categoria');
    }
  };
  const removeCategory = async (id: string) => {
    try {
      await TaxonomyService.deleteCategory(id);
      toast.success('Categoria removida');
      loadAll();
    } catch {
      toast.error('Falha ao remover categoria');
    }
  };

  const addSubcat = async () => {
    const name = newSubcategory.trim();
    if (!name) return;
    try {
      await TaxonomyService.addSubcategory(name, subcategoryCategory || undefined);
      setNewSubcategory('');
      toast.success('Subcategoria adicionada');
      loadAll();
    } catch {
      toast.error('Falha ao adicionar subcategoria');
    }
  };
  const removeSubcat = async (id: string) => {
    try {
      await TaxonomyService.deleteSubcategory(id);
      toast.success('Subcategoria removida');
      loadAll();
    } catch {
      toast.error('Falha ao remover subcategoria');
    }
  };

  const addLocation = async () => {
    const name = newLocation.trim();
    if (!name) return;
    try {
      await TaxonomyService.addLocation(name);
      setNewLocation('');
      toast.success('Localização adicionada');
      loadAll();
    } catch {
      toast.error('Falha ao adicionar localização');
    }
  };
  const removeLocation = async (id: string) => {
    try {
      await TaxonomyService.deleteLocation(id);
      toast.success('Localização removida');
      loadAll();
    } catch {
      toast.error('Falha ao remover localização');
    }
  };

  const addPaymentRange = async () => {
    const label = newPaymentLabel.trim();
    if (!label) return;
    try {
      const min = newPaymentMin ? Number(newPaymentMin) : undefined;
      const max = newPaymentMax ? Number(newPaymentMax) : undefined;
      await TaxonomyService.addPaymentRange(label, min, max);
      setNewPaymentLabel('');
      setNewPaymentMin('');
      setNewPaymentMax('');
      toast.success('Faixa de pagamento adicionada');
      loadAll();
    } catch {
      toast.error('Falha ao adicionar faixa de pagamento');
    }
  };
  const removePaymentRange = async (id: string) => {
    try {
      await TaxonomyService.deletePaymentRange(id);
      toast.success('Faixa de pagamento removida');
      loadAll();
    } catch {
      toast.error('Falha ao remover faixa de pagamento');
    }
  };

  const addStats = async () => {
    const name = newStatsLabel.trim();
    if (!name) return;
    try {
      await TaxonomyService.addStatsLabel(name);
      setNewStatsLabel('');
      toast.success('Etiqueta de estatística adicionada');
      loadAll();
    } catch {
      toast.error('Falha ao adicionar etiqueta');
    }
  };
  const removeStats = async (id: string) => {
    try {
      await TaxonomyService.deleteStatsLabel(id);
      toast.success('Etiqueta removida');
      loadAll();
    } catch {
      toast.error('Falha ao remover etiqueta');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Gerenciar Listas (Taxonomias)
          </CardTitle>
          <CardDescription>
            Adicione ou remova opções exibidas no site sem alterar código.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Nível de trabalho */}
          <section className="space-y-3">
            <Label>Nível de trabalho</Label>
            <div className="flex gap-2">
              <Input placeholder="Ex.: Fácil, Médio, Difícil" value={newLevel} onChange={(e) => setNewLevel(e.target.value)} />
              <Button onClick={addLevel}>Adicionar</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {jobLevels.map((lvl) => (
                <div key={lvl.id} className="flex items-center gap-2 border rounded px-2 py-1">
                  <span>{lvl.name}</span>
                  <Button variant="destructive" size="icon" onClick={() => removeLevel(lvl.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </section>

          {/* Categoria */}
          <section className="space-y-3">
            <Label>Categoria</Label>
            <div className="flex gap-2">
              <Input placeholder="Ex.: Mobile, Web, Social" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
              <Button onClick={addCategory}>Adicionar</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-2 border rounded px-2 py-1">
                  <span>{cat.name}</span>
                  <Button variant="destructive" size="icon" onClick={() => removeCategory(cat.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </section>

          {/* Subcategoria */}
          <section className="space-y-3">
            <Label>Subcategoria</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input placeholder="Ex.: Instagram, Landing Page" value={newSubcategory} onChange={(e) => setNewSubcategory(e.target.value)} />
              <Select value={subcategoryCategory} onValueChange={setSubcategoryCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={addSubcat}>Adicionar</Button>
            </div>
            <div className="space-y-2">
              {Object.entries(groupedSubcategories).map(([catName, items]) => (
                <div key={catName} className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">{catName === '__sem_categoria__' ? 'Sem categoria' : catName}</div>
                  <div className="flex flex-wrap gap-2">
                    {items.map((sc) => (
                      <div key={sc.id} className="flex items-center gap-2 border rounded px-2 py-1">
                        <span>{sc.name}</span>
                        <Button variant="destructive" size="icon" onClick={() => removeSubcat(sc.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Pagamento */}
          <section className="space-y-3">
            <Label>Pagamento (faixas em Kz)</Label>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <Input placeholder="Etiqueta (Ex.: Até 1.000 Kz)" value={newPaymentLabel} onChange={(e) => setNewPaymentLabel(e.target.value)} />
              <Input placeholder="Mín." type="number" value={newPaymentMin} onChange={(e) => setNewPaymentMin(e.target.value)} />
              <Input placeholder="Máx." type="number" value={newPaymentMax} onChange={(e) => setNewPaymentMax(e.target.value)} />
              <Button onClick={addPaymentRange}>Adicionar</Button>
            </div>
            <div className="space-y-2">
              {paymentRanges.map((pr) => (
                <div key={pr.id} className="flex items-center justify-between border rounded px-3 py-2">
                  <div className="text-sm">
                    <div className="font-medium">{pr.label}</div>
                    <div className="text-muted-foreground">
                      {typeof pr.min === 'number' ? `Min: ${pr.min} Kz` : 'Min: -'} | {typeof pr.max === 'number' ? `Max: ${pr.max} Kz` : 'Max: -'}
                    </div>
                  </div>
                  <Button variant="destructive" size="icon" onClick={() => removePaymentRange(pr.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </section>

          {/* Localização */}
          <section className="space-y-3">
            <Label>Localização</Label>
            <div className="flex gap-2">
              <Input placeholder="Ex.: Luanda, Benguela" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} />
              <Button onClick={addLocation}>Adicionar</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {locations.map((loc) => (
                <div key={loc.id} className="flex items-center gap-2 border rounded px-2 py-1">
                  <span>{loc.name}</span>
                  <Button variant="destructive" size="icon" onClick={() => removeLocation(loc.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </section>

          {/* Emp. Estatísticas */}
          <section className="space-y-3">
            <Label>Emp. Estatísticas (etiquetas)</Label>
            <div className="flex gap-2">
              <Input placeholder="Ex.: Alta aprovação" value={newStatsLabel} onChange={(e) => setNewStatsLabel(e.target.value)} />
              <Button onClick={addStats}>Adicionar</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {statsLabels.map((st) => (
                <div key={st.id} className="flex items-center gap-2 border rounded px-2 py-1">
                  <span>{st.name}</span>
                  <Button variant="destructive" size="icon" onClick={() => removeStats(st.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTaxonomyManager;