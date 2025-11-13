import { Card, CardContent } from '@/components/ui/card';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <section className="border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-10">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Política de Privacidade</h1>
          <p className="text-sm text-muted-foreground mt-1">Última revisão: 08 de outubro de 2024</p>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8">
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="prose prose-invert max-w-none prose-p:leading-relaxed">
            <h2 className="pt-6">Introdução</h2>
            <p>
              Esta Política de Privacidade descreve como a Freelincer coleta, utiliza, compartilha e protege dados pessoais
              quando você usa nosso Site e Serviços. Ao acessar ou utilizar a plataforma, você concorda com os termos desta
              política.
            </p>

            <h2>Âmbito e Definições</h2>
            <p>
              Esta política aplica-se aos usuários em qualquer modo de uso (Freelancer ou Contratante). “Dados pessoais”
              significa qualquer informação relacionada a pessoa natural identificada ou identificável.
            </p>

            <h2>Categorias de Dados Coletados</h2>
            <ul>
              <li>Dados de cadastro: nome, e-mail, telefone, localização, foto de perfil.</li>
              <li>Dados de conta e uso: tarefas criadas/concluídas, histórico de transações, mensagens e avaliações.</li>
              <li>Dados técnicos: IP, dispositivo, navegador, páginas acessadas, tempo de sessão e preferências (tema/idioma).</li>
              <li>Dados de verificação e conformidade: documentos e informações para KYC/antifraude quando exigido por lei.</li>
            </ul>

            <h2>Base Legal para o Tratamento</h2>
            <ul>
              <li>Execução de contrato: para operar a plataforma, processar tarefas e transações.</li>
              <li>Interesse legítimo: melhorias de produto, segurança, prevenção a fraudes e suporte.</li>
              <li>Consentimento: comunicações de marketing e certos recursos opcionais.</li>
              <li>Obrigação legal: cumprimento de requisitos regulatórios e solicitações de autoridades.</li>
            </ul>

            <h2>Finalidades do Tratamento</h2>
            <ul>
              <li>Prover e manter os Serviços, autenticar usuários e gerenciar contas.</li>
              <li>Processar pagamentos, saques e registrar transações.</li>
              <li>Facilitar publicação/execução de tarefas, avaliações e comunicações.</li>
              <li>Melhorar performance, personalizar experiência e realizar análises de uso.</li>
              <li>Prevenir abusos, investigar atividades suspeitas e cumprir determinações legais.</li>
            </ul>

            <h2>Cookies e Tecnologias Similares</h2>
            <p>
              Utilizamos cookies e identificadores locais para login, tema, idioma e analytics. Você pode ajustar preferências
              no navegador; alguns recursos podem ficar limitados sem cookies.
            </p>

            <h2>Compartilhamento de Dados</h2>
            <p>
              Não vendemos dados pessoais. Podemos compartilhar informações com provedores de pagamento, hospedagem,
              analytics, verificação e suporte, estritamente para prestação dos Serviços. Também podemos compartilhar com
              autoridades quando exigido por lei.
            </p>

            <h2>Transferências Internacionais</h2>
            <p>
              Quando houver transferência para fora do seu país, adotaremos salvaguardas adequadas (como cláusulas
              contratuais padrão) para proteger seus dados de acordo com leis aplicáveis.
            </p>

            <h2>Segurança</h2>
            <p>
              Implementamos controles técnicos e organizacionais para proteger informações contra acesso não autorizado,
              uso indevido, alteração e destruição. Nenhuma solução é infalível; recomendamos práticas de segurança pelo
              usuário.
            </p>

            <h2>Retenção</h2>
            <p>
              Mantemos dados pelo período necessário para cumprir finalidades e exigências legais. Ao encerrar a conta,
              poderemos reter registros por tempo adicional conforme obrigações regulatórias.
            </p>

            <h2>Seus Direitos</h2>
            <ul>
              <li>Acesso, correção, exclusão e portabilidade de dados pessoais.</li>
              <li>Oposição e limitação de tratamento quando aplicável.</li>
              <li>Revogação de consentimento para tratamentos baseados em consentimento.</li>
            </ul>

            <h2>Privacidade de Menores</h2>
            <p>
              A plataforma não é destinada a menores de 18 anos. Não coletamos intencionalmente dados de menores.
            </p>

            <h2>Alterações nesta Política</h2>
            <p>
              Podemos atualizar esta política periodicamente. Quando apropriado, notificaremos mudanças materiais no Site
              ou por e-mail. O uso contínuo após a publicação implica aceitação.
            </p>

            <h2>Contato</h2>
            <p>
              Para dúvidas sobre privacidade, contate
              {' '}<a href="mailto:suporte@freelincer.com" className="text-primary hover:underline">suporte@freelincer.com</a>.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Privacy;