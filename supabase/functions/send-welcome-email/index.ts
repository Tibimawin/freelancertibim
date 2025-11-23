import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  to: string;
  userName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, userName }: WelcomeEmailRequest = await req.json();

    console.log(`Sending welcome email to ${to}`);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f97316, #14b8a6); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .feature { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #f97316; }
            .button { display: inline-block; background: linear-gradient(135deg, #f97316, #14b8a6); color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold; }
            .stats { display: flex; justify-content: space-around; margin: 30px 0; }
            .stat { text-align: center; }
            .stat-number { font-size: 32px; font-weight: bold; color: #f97316; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Bem-vindo ao Ango Tarefas!</h1>
              <p style="font-size: 18px; margin-top: 10px;">Olá, ${userName}!</p>
            </div>
            <div class="content">
              <p style="font-size: 18px; margin-bottom: 20px;">
                Estamos muito felizes em tê-lo(a) conosco! 🚀
              </p>
              
              <p>
                O Ango Tarefas é a plataforma #1 para freelancers em Angola. 
                Aqui você pode ganhar dinheiro realizando tarefas simples ou oferecendo seus serviços.
              </p>

              <div class="stats">
                <div class="stat">
                  <div class="stat-number">5K+</div>
                  <div>Freelancers Ativos</div>
                </div>
                <div class="stat">
                  <div class="stat-number">2M+</div>
                  <div>Pagos</div>
                </div>
                <div class="stat">
                  <div class="stat-number">4.9</div>
                  <div>Avaliação</div>
                </div>
              </div>

              <h3 style="color: #f97316; margin-top: 30px;">🎯 Como começar:</h3>
              
              <div class="feature">
                <strong>1. Complete seu perfil</strong>
                <p>Adicione suas habilidades e uma foto para aumentar suas chances.</p>
              </div>
              
              <div class="feature">
                <strong>2. Explore tarefas disponíveis</strong>
                <p>Navegue pelas tarefas e escolha as que mais combinam com você.</p>
              </div>
              
              <div class="feature">
                <strong>3. Ganhe XP e suba de nível</strong>
                <p>Complete tarefas e avalie-as para ganhar XP e desbloquear recompensas!</p>
              </div>

              <div style="background: linear-gradient(135deg, #fef3c7, #dbeafe); padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
                <h3 style="margin: 0 0 10px 0;">🎁 Bônus de Boas-Vindas!</h3>
                <p style="margin: 0; font-size: 24px; font-weight: bold; color: #f97316;">500 Kz</p>
                <p style="margin: 10px 0 0 0; font-size: 14px;">Creditados na sua conta!</p>
              </div>

              <p style="text-align: center;">
                <a href="https://angotarefas.com" class="button">Começar Agora</a>
              </p>

              <p style="margin-top: 40px; color: #6b7280; font-size: 14px; text-align: center;">
                Precisa de ajuda? Entre em contato conosco a qualquer momento!<br>
                <strong>Equipe Ango Tarefas</strong>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Ango Tarefas <noreply@angotarefas.com>",
      to: [to],
      subject: "🎉 Bem-vindo ao Ango Tarefas - Ganhe 500 Kz de bônus!",
      html: html,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
