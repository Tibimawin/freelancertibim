import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProofStatusEmailRequest {
  to: string;
  userName: string;
  jobTitle: string;
  status: 'approved' | 'rejected';
  rejectionReason?: string;
  bounty?: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, userName, jobTitle, status, rejectionReason, bounty }: ProofStatusEmailRequest = await req.json();

    console.log(`Sending ${status} email to ${to} for job: ${jobTitle}`);

    const isApproved = status === 'approved';
    const subject = isApproved 
      ? `✅ Tarefa Aprovada: ${jobTitle}`
      : `❌ Tarefa Rejeitada: ${jobTitle}`;

    const html = isApproved ? `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f97316, #14b8a6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .amount { font-size: 32px; font-weight: bold; color: #10b981; margin: 20px 0; }
            .button { display: inline-block; background: linear-gradient(135deg, #f97316, #14b8a6); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Parabéns, ${userName}!</h1>
            </div>
            <div class="content">
              <div class="success-box">
                <h2>✅ Sua tarefa foi aprovada!</h2>
                <p><strong>Tarefa:</strong> ${jobTitle}</p>
              </div>
              <p>Suas provas foram revisadas e aprovadas pelo contratante.</p>
              ${bounty ? `
                <div style="text-align: center;">
                  <p>Valor creditado:</p>
                  <div class="amount">${bounty.toFixed(2)} Kz</div>
                </div>
              ` : ''}
              <p>O pagamento já está disponível em sua carteira.</p>
              <p style="text-align: center;">
                <a href="https://angotarefas.com" class="button">Ver Minhas Tarefas</a>
              </p>
              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                Continue fazendo um ótimo trabalho!<br>
                Equipe Ango Tarefas
              </p>
            </div>
          </div>
        </body>
      </html>
    ` : `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f97316, #14b8a6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .error-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .button { display: inline-block; background: linear-gradient(135deg, #f97316, #14b8a6); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Olá, ${userName}</h1>
            </div>
            <div class="content">
              <div class="error-box">
                <h2>❌ Tarefa Rejeitada</h2>
                <p><strong>Tarefa:</strong> ${jobTitle}</p>
              </div>
              <p>Infelizmente, suas provas não foram aprovadas pelo contratante.</p>
              ${rejectionReason ? `
                <p><strong>Motivo da rejeição:</strong></p>
                <p style="background: white; padding: 15px; border-radius: 5px;">${rejectionReason}</p>
              ` : ''}
              <p>Não desanime! Revise os requisitos e tente novamente em outras tarefas.</p>
              <p style="text-align: center;">
                <a href="https://angotarefas.com" class="button">Ver Tarefas Disponíveis</a>
              </p>
              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                Continue tentando!<br>
                Equipe Ango Tarefas
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Ango Tarefas <noreply@angotarefas.com>",
      to: [to],
      subject: subject,
      html: html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending proof status email:", error);
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
