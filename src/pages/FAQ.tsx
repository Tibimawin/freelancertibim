import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

const FAQ = () => {
  return (
    <div className="min-h-screen bg-background">
      <section className="border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-10">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Perguntas Frequentes</h1>
          <p className="text-sm text-muted-foreground mt-1">Tire suas dúvidas sobre como usar a plataforma</p>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8">
        <Card className="bg-card border-border shadow-sm">
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-account-create">
                <AccordionTrigger>Conta e Verificação — Como crio uma conta?</AccordionTrigger>
                <AccordionContent>
                  Clique em "Entrar" e siga o fluxo de cadastro com e-mail e senha.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-email-verify">
                <AccordionTrigger>Conta e Verificação — Preciso verificar meu e-mail?</AccordionTrigger>
                <AccordionContent>
                  Sim. A verificação habilita todos os recursos e fortalece a segurança da sua conta.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-freelancers-find">
                <AccordionTrigger>Freelancers (Testers) — Como encontro tarefas?</AccordionTrigger>
                <AccordionContent>
                  Use a página inicial e aplique filtros por categoria, pagamento e dificuldade para encontrar tarefas adequadas.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-freelancers-rewards">
                <AccordionTrigger>Freelancers (Testers) — Como recebo minhas recompensas?</AccordionTrigger>
                <AccordionContent>
                  Após aprovação da prova, seu saldo é creditado em Kz. Você pode solicitar saque conforme as regras disponíveis na área de Transações.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-posters-create">
                <AccordionTrigger>Contratantes (Posters) — Como publico uma tarefa?</AccordionTrigger>
                <AccordionContent>
                  Clique em "Criar Tarefa", defina título, descrição, valor, prazo e critérios de aprovação para publicar.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-posters-approve">
                <AccordionTrigger>Contratantes (Posters) — Como aprovo ou rejeito provas?</AccordionTrigger>
                <AccordionContent>
                  Acesse "Gerir Anúncios", avalie as submissões e aprove ou recuse com feedback claro para o tester.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-payments-methods">
                <AccordionTrigger>Pagamentos e Saques — Quais são os métodos de saque?</AccordionTrigger>
                <AccordionContent>
                  Oferecemos métodos locais e digitais. Consulte "Transações" para ver opções atualizadas, limites e prazos.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-payments-fees">
                <AccordionTrigger>Pagamentos e Saques — Há taxas?</AccordionTrigger>
                <AccordionContent>
                  Alguns métodos podem ter taxas variáveis. As taxas são exibidas antes da confirmação do saque.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-support-contact">
                <AccordionTrigger>Suporte — Como entro em contato?</AccordionTrigger>
                <AccordionContent>
                  Use o ícone de suporte no canto da tela ou envie e-mail para
                  {' '}<a href="mailto:suporte@freelincer.com" className="text-primary hover:underline">suporte@freelincer.com</a>.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default FAQ;