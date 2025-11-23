import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewTaskEmailRequest {
  to: string;
  contractorName: string;
  taskTitle: string;
  taskBounty: number;
  taskDescription: string;
  applicantName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, contractorName, taskTitle, taskBounty, taskDescription, applicantName }: NewTaskEmailRequest = await req.json();

    console.log(`Sending new task notification to ${to} for task: ${taskTitle}`);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f97316, #14b8a6); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .task-box { background: white; padding: 25px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #f97316; }
            .applicant-info { background: linear-gradient(135deg, #fef3c7, #dbeafe); padding: 20px; border-radius: 8px; margin: 20px 0; }
            .button { display: inline-block; background: linear-gradient(135deg, #f97316, #14b8a6); color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold; }
            .amount { font-size: 32px; font-weight: bold; color: #f97316; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📢 Nova Aplicação Recebida!</h1>
            </div>
            <div class="content">
              <p style="font-size: 18px;">
                Olá ${contractorName},
              </p>
              
              <p>
                Você recebeu uma nova aplicação para sua tarefa!
              </p>

              <div class="task-box">
                <h2 style="color: #f97316; margin-top: 0;">📋 ${taskTitle}</h2>
                <p style="color: #6b7280; margin-bottom: 15px;">${taskDescription}</p>
                <div style="text-align: center; margin: 20px 0;">
                  <p style="margin: 5px 0; color: #6b7280;">Valor da Tarefa:</p>
                  <div class="amount">${taskBounty.toFixed(2)} Kz</div>
                </div>
              </div>

              <div class="applicant-info">
                <h3 style="margin-top: 0; color: #14b8a6;">👤 Candidato</h3>
                <p style="margin: 0; font-size: 18px; font-weight: bold;">${applicantName}</p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">
                  Aplicou para esta tarefa
                </p>
              </div>

              <div style="background: #e0f2fe; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #0284c7;">
                <h3 style="margin: 0 0 10px 0; color: #0284c7;">⏰ Próximos Passos</h3>
                <ol style="margin: 10px 0; padding-left: 20px;">
                  <li>Revise o perfil do candidato</li>
                  <li>Aguarde a submissão das provas</li>
                  <li>Aprove ou rejeite o trabalho</li>
                </ol>
              </div>

              <p style="text-align: center;">
                <a href="https://angotarefas.com/manage-applications" class="button">Gerenciar Aplicações</a>
              </p>

              <p style="margin-top: 40px; color: #6b7280; font-size: 14px; text-align: center;">
                Você receberá outra notificação quando o candidato enviar as provas.<br>
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
      subject: `📢 Nova aplicação: ${applicantName} aplicou para "${taskTitle}"`,
      html: html,
    });

    console.log("New task notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending new task email:", error);
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
