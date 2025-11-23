import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InactiveUserEmailRequest {
  to: string;
  userName: string;
  daysSinceLastLogin: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, userName, daysSinceLastLogin }: InactiveUserEmailRequest = await req.json();

    console.log(`Sending reactivation email to ${to} (${daysSinceLastLogin} days inactive)`);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f97316, #14b8a6); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .highlight-box { background: linear-gradient(135deg, #fef3c7, #dbeafe); padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center; }
            .task-card { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #14b8a6; }
            .button { display: inline-block; background: linear-gradient(135deg, #f97316, #14b8a6); color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>😊 Sentimos sua falta, ${userName}!</h1>
            </div>
            <div class="content">
              <p style="font-size: 18px;">
                Olá ${userName},
              </p>
              
              <p>
                Percebemos que você não acessa o Ango Tarefas há ${daysSinceLastLogin} dias. 
                Muita coisa aconteceu desde então!
              </p>

              <div class="highlight-box">
                <h2 style="margin: 0 0 15px 0; color: #f97316;">🎁 Oferta Especial de Retorno!</h2>
                <p style="font-size: 32px; font-weight: bold; margin: 10px 0; color: #14b8a6;">Bônus Exclusivo</p>
                <p style="margin: 0; font-size: 14px; color: #6b7280;">Válido apenas nos próximos 7 dias</p>
              </div>

              <h3 style="color: #f97316;">🔥 Novidades que você perdeu:</h3>
              
              <div class="task-card">
                <strong>📊 Sistema de XP e Níveis</strong>
                <p>Agora você ganha XP ao completar tarefas e avaliar trabalhos. Suba de nível e desbloqueie recompensas!</p>
              </div>
              
              <div class="task-card">
                <strong>🏆 Ranking de Freelancers</strong>
                <p>Compita com outros freelancers e apareça no top 10 da plataforma!</p>
              </div>
              
              <div class="task-card">
                <strong>💰 Novas Tarefas Disponíveis</strong>
                <p>Centenas de novas tarefas foram adicionadas enquanto você estava fora.</p>
              </div>

              <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ef4444;">
                <p style="margin: 0; font-size: 14px;">
                  ⏰ <strong>Atenção:</strong> Após 30 dias de inatividade, sua conta pode ser desativada. 
                  Não perca seu progresso e suas conquistas!
                </p>
              </div>

              <p style="text-align: center;">
                <a href="https://angotarefas.com" class="button">Voltar à Plataforma</a>
              </p>

              <p style="margin-top: 40px; color: #6b7280; font-size: 14px; text-align: center;">
                Estamos esperando por você!<br>
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
      subject: "😊 Sentimos sua falta! Volte e ganhe um bônus exclusivo",
      html: html,
    });

    console.log("Reactivation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending reactivation email:", error);
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
