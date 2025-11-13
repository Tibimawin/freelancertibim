const SobreNos = () => {
  return (
    <div className="min-h-screen bg-background">
      <section className="border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-10">
          <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight">Sobre a Ango Tarefas</h1>
          <p className="text-sm text-muted-foreground mt-2">Informações institucionais sobre a nossa plataforma.</p>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-5 text-foreground">
          <p className="leading-relaxed">
            A Ango Tarefas nasceu para aproximar contratantes e freelancers em um ambiente simples, seguro e eficiente.
            Aqui, quem precisa de resultados cria trabalhos com objetivos claros e quem realiza executa as tarefas com qualidade,
            envia provas e recebe após aprovação.
          </p>

          <p className="leading-relaxed">
            Nosso foco é a transparência: instruções bem definidas, prazos objetivos e pagamentos justos. A plataforma inclui
            mercado de tarefas, gerenciamento de aplicações, mensagens diretas, suporte, perfil com verificação (KYC), carteira e
            área de transações para depósitos e saques.
          </p>

          <p className="leading-relaxed">
            Para contratantes, oferecemos a criação de campanhas e tarefas digitais com acompanhamento em tempo real, avaliação de
            provas e gestão de resultados. Para freelancers, disponibilizamos oportunidades de trabalho, histórico de entregas e
            comunicação direta com quem contrata.
          </p>

          <p className="leading-relaxed">
            Nossa missão é tornar simples e confiável a colaboração entre quem precisa e quem faz, promovendo qualidade,
            rapidez e segurança em cada etapa. Construímos uma comunidade que valoriza respeito, responsabilidade e crescimento
            mútuo.
          </p>

          <p className="leading-relaxed">
            Se você deseja criar um trabalho, acesse <a href="/create-job" className="text-primary hover:underline">Criar trabalho</a>.
            Se quer encontrar oportunidades, visite o <a href="/market" className="text-primary hover:underline">Mercado</a>.
          </p>
        </div>
      </main>
    </div>
  );
};

export default SobreNos;