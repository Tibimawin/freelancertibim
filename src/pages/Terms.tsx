import { Card, CardContent } from '@/components/ui/card';

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero / Heading */}
      <section className="border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-10">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            Termos de Uso
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Última revisão: 08 de outubro de 2024
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="prose prose-invert max-w-none prose-p:leading-relaxed prose-h2:text-foreground prose-h3:text-foreground">
            <h2 className="pt-6">Bem-vindo</h2>
            <p>
              Bem-vindo à Ango Tarefas! Este contrato ("Termos de Uso" ou "Contrato") define os termos e condições
              que regem seu relacionamento conosco. Os termos "Ango Tarefas", "nós" e "nosso" referem-se à plataforma
              e os termos "você" e "seu" referem-se ao indivíduo que abre uma conta ou realiza transações conosco.
              Este Contrato substitui todos os acordos anteriores entre você e a Ango Tarefas.
            </p>

            <p>
              Leia este Contrato com atenção e guarde uma cópia para seus registros. Ao usar nossos Serviços,
              você concorda em ficar vinculado a estes termos e condições e em cumprir todas as leis aplicáveis.
              Este Contrato inclui uma disposição de arbitragem que exige a resolução de disputas por meio de arbitragem
              e renúncia ao seu direito de participar de reivindicações de classe ou grupo. Se você não concordar com estes
              termos, não acesse ou use nosso Site ou nossos Serviços.
            </p>

            <h2>Privacidade</h2>
            <p>
              Nossa Política de Privacidade, que pode ser encontrada em
              {' '}<a href="https://www.angotarefas.online/privacy" target="_blank" rel="noreferrer" className="text-primary hover:underline">https://www.angotarefas.online/privacy</a>,
              também rege o uso de nossos Serviços. Ela explica como coletamos, usamos e compartilhamos suas informações.
              Você só pode usar a conta para transações descritas neste Contrato. Reservamo-nos o direito de modificar
              ou cancelar nossos Serviços a qualquer momento, sem aviso prévio, e de implementar controles de monitoramento
              de fraudes que possam limitar seu acesso ao dinheiro ou limites de gastos. Quaisquer novos recursos ou
              ferramentas adicionados ao nosso Site também estão sujeitos a estes Termos de Uso. Podemos atualizar estes
              Termos periodicamente, e é sua responsabilidade verificar esta página para alterações. O uso continuado do
              Site após a publicação das alterações constitui sua aceitação das modificações.
            </p>

            <h2>Uso dos Serviços</h2>
            <p>
              Se você estiver registrando ou usando os Serviços em nome de um grupo, empresa, entidade ou organização
              ("Organização Subscritor"), você declara e garante que tem autoridade para vincular a organização a estes
              Termos de Uso. Nesses casos, as referências a "você" incluirão você em sua capacidade individual, bem como
              a Organização Assinante e quaisquer outros indivíduos que usem os Serviços em nome da Organização Assinante
              ou com sua autoridade ou consentimento.
            </p>

            <h2>Termos Gerais</h2>
            <p>
              Para usar nosso Site e fazer compras de Serviços, você não deve residir em um país sancionado pelos EUA e
              deve ter pelo menos 18 anos de idade (desde que certos Comerciantes ou Provedores de Serviços terceirizados
              imponham maiores restrições de idade para acesso a seus sites ou para comprar seus produtos ou serviços).
              Você declara e garante que: (a) todas as informações de registro são verdadeiras e precisas e (b) manterá a
              precisão de tais informações. Reservamo-nos o direito de rescindir os Serviços a qualquer momento e encerrar
              as Contas de qualquer Membro que tenha aberto várias Contas ou se registrado várias vezes para Contas sem
              aviso prévio e a nosso exclusivo critério. Não obstante qualquer disposição em contrário neste Acordo, não
              temos obrigação de fornecer quaisquer serviços que a qualquer candidato ou Membro e podemos recusar qualquer
              solicitação para participar de qualquer uma de nossas ofertas de Serviços a nosso exclusivo critério.
            </p>

            <h3>Alterações e atualizações</h3>
            <p>
              Podemos alterar, atualizar ou descontinuar partes dos Serviços para melhorar a experiência, segurança ou
              conformidade legal. Quando apropriado, comunicaremos mudanças materiais através de avisos no Site ou por e-mail.
            </p>

            <h3>Contato</h3>
            <p>
              Para dúvidas sobre estes Termos, entre em contato com nosso suporte por e-mail em
              {' '}<a href="mailto:suporte@angotarefas.online" className="text-primary hover:underline">suporte@angotarefas.online</a>.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Terms;