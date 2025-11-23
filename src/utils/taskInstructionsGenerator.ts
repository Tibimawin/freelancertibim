/**
 * Gera instruções automáticas baseadas no tipo/categoria da tarefa
 */

export const generateAutomaticInstructions = (job: {
  category?: string;
  subcategory?: string;
  platform?: string;
  youtube?: any;
  instagram?: any;
  facebook?: any;
  tiktok?: any;
  vk?: any;
  website?: any;
  emailCreation?: any;
  twitter?: any;
}): string => {
  const category = (job.category || '').toLowerCase();
  const subcategory = (job.subcategory || '').toLowerCase();
  
  // Email Creation Tasks
  if (job.emailCreation || subcategory.includes('criar e-mail') || subcategory.includes('criar email')) {
    return `📧 **Como criar e enviar credenciais de e-mail:**

1. **Acessar o provedor**: Vá ao site do ${job.emailCreation?.provider || 'provedor de e-mail especificado'} (${getProviderUrl(job.emailCreation?.provider)})
2. **Criar conta**: Clique em "Criar conta" ou "Sign up"
3. **Preencher dados**: Complete o formulário com seus dados pessoais
4. **Escolher credenciais**: Crie um endereço de e-mail e senha forte
   ${job.emailCreation?.requirements ? `   - Requisitos: ${job.emailCreation.requirements}` : ''}
5. **Verificação**: Complete a verificação de segurança (telefone, código, etc.)
6. **Confirmar criação**: Verifique que a conta foi criada com sucesso
7. **⚠️ CRÍTICO: FAZER LOGOUT**: Saia completamente da conta no seu dispositivo
8. **Enviar credenciais**: Preencha os campos abaixo com as informações da conta criada

⚠️ **MUITO IMPORTANTE:**
- Você DEVE fazer logout completo da conta antes de enviar
- NÃO compartilhe credenciais de contas pessoais
- Envie apenas credenciais de contas RECÉM-criadas
- Verifique se e-mail e senha estão corretos antes de enviar
- Credenciais inválidas resultarão em rejeição automática

🔒 **Segurança:** Suas credenciais são enviadas apenas ao contratante da tarefa. O sistema monitora todas as transações para prevenir fraudes.`;
  }
  
  // YouTube Tasks
  if (job.youtube || subcategory.includes('youtube') || subcategory.includes('ver vídeo')) {
    if (job.youtube?.actionType === 'watch') {
      return `📺 **Como completar esta tarefa:**

1. Clique no botão "Assistir Vídeo" para abrir o vídeo do YouTube
2. Assista ao vídeo por pelo menos ${job.youtube?.viewTimeSeconds || 30} segundos
3. Aguarde até que a barra de progresso complete
4. Após assistir o tempo necessário, envie a prova solicitada
5. O contratante irá revisar sua submissão

⚠️ **Importante:** Não feche o vídeo antes de completar o tempo mínimo exigido!`;
    } else if (job.youtube?.actionType === 'subscribe') {
      return `📺 **Como completar esta tarefa:**

1. Clique no botão "Inscrever-se no Canal" para abrir a página do canal
2. Clique no botão vermelho "INSCREVER-SE" no YouTube
3. Aguarde pelo menos ${10} segundos na página do canal
4. Após se inscrever e aguardar, envie a prova solicitada (screenshot mostrando que está inscrito)
5. O contratante irá revisar sua submissão

⚠️ **Importante:** Tire um screenshot mostrando claramente que você está inscrito no canal!`;
    }
  }

  // Instagram Tasks
  if (job.instagram || subcategory.includes('instagram')) {
    const action = job.instagram?.actionType || 'follow';
    
    if (action === 'follow') {
      return `📸 **COMO SEGUIR PERFIL NO INSTAGRAM:**

**Passo a Passo:**
1. 📱 Clique no botão "Abrir Perfil" para abrir o perfil do Instagram
   ${job.instagram?.extras?.openInIframe ? '   - Você pode usar o botão "Abrir em iframe" para facilitar' : ''}
2. 👤 Localize o botão "Seguir" no perfil
3. ➕ Clique no botão "Seguir"
4. ⏳ Aguarde 5-10 segundos para confirmar que está seguindo
5. 📸 Tire um screenshot mostrando que você está seguindo o perfil
6. ✅ Clique em "Confirmar Seguimento" abaixo
7. 📤 Envie o screenshot e o link do perfil nos campos de prova

**O que seu screenshot DEVE mostrar:**
- O botão "Seguindo" ativo (não mais "Seguir")
- O nome do perfil completo visível
- Seu nome de usuário do Instagram (se visível)

**Links necessários:**
- 🔗 URL do perfil que você seguiu (copie da barra de endereços)

⚠️ **AVISOS IMPORTANTES:**
- Certifique-se de que o botão mudou para "Seguindo"
- NÃO deixe de seguir o perfil após enviar a prova
- Screenshots que não mostram "Seguindo" serão rejeitados
- Aguarde a aprovação do contratante antes de receber pagamento

💡 **Dica:** Se já segue o perfil, deixe de seguir primeiro e depois siga novamente!`;
    }
    
    if (action === 'like') {
      return `📸 **COMO CURTIR PUBLICAÇÃO NO INSTAGRAM:**

**Passo a Passo:**
1. 📱 Clique no botão "Abrir Publicação" para abrir o post do Instagram
   ${job.instagram?.extras?.openInIframe ? '   - Você pode usar o botão "Abrir em iframe" para facilitar' : ''}
2. ❤️ Localize o ícone de coração abaixo da publicação
3. 👆 Clique no coração para curtir a publicação
4. ⏳ Aguarde o coração ficar vermelho (confirmação visual)
5. 📸 Tire um screenshot mostrando a curtida ativa
6. ✅ Clique em "Confirmar Curtida" abaixo
7. 📤 Envie o screenshot e o link da publicação nos campos de prova

**O que seu screenshot DEVE mostrar:**
- O coração VERMELHO (curtida ativa)
- A publicação completa visível
- Seu nome de usuário do Instagram (se visível)

**Links necessários:**
- 🔗 URL da publicação que você curtiu (copie da barra de endereços)

⚠️ **AVISOS IMPORTANTES:**
- O coração DEVE estar VERMELHO no screenshot
- NÃO tire screenshot antes de curtir
- NÃO remova a curtida após enviar a prova
- Screenshots sem coração vermelho serão rejeitados
- Aguarde a aprovação do contratante antes de receber pagamento

💡 **Dica:** Você pode dar duplo toque na imagem para curtir rapidamente!`;
    }
    
    if (action === 'comment') {
      const minChars = job.instagram?.minCommentLength || 20;
      return `📸 **COMO COMENTAR PUBLICAÇÃO NO INSTAGRAM:**

**Passo a Passo:**
1. 📱 Clique no botão "Abrir Publicação" para abrir o post do Instagram
   ${job.instagram?.extras?.openInIframe ? '   - Você pode usar o botão "Abrir em iframe" para facilitar' : ''}
2. 💬 Clique no ícone de comentário abaixo da publicação
3. ✍️ Escreva um comentário relevante e respeitoso (mínimo ${minChars} caracteres)
4. 📝 Certifique-se de que o comentário faz sentido e agrega valor
5. ➡️ Publique o comentário
6. ⏳ Aguarde a confirmação visual (seu comentário aparecerá na lista)
7. 📸 Tire um screenshot mostrando seu comentário publicado
8. 📋 Copie o TEXTO COMPLETO do seu comentário
9. ✅ Clique em "Confirmar Comentário" abaixo
10. 📤 Envie o screenshot, texto do comentário e link da publicação

**O que seu screenshot DEVE mostrar:**
- Seu comentário publicado E VISÍVEL
- Seu nome de usuário do Instagram ao lado do comentário
- A publicação original visível no contexto

**Informações necessárias:**
- 🔗 URL da publicação que você comentou
- 📝 Texto COMPLETO do seu comentário

⚠️ **AVISOS IMPORTANTES:**
- Comentários genéricos ("Legal!", "👍") serão REJEITADOS
- O comentário deve ter pelo menos ${minChars} caracteres
- NÃO copie comentários de outras pessoas
- NÃO use spam ou linguagem ofensiva
- NÃO delete o comentário após enviar a prova
- Aguarde a aprovação do contratante antes de receber pagamento

💡 **Exemplos de bons comentários:**
- "Adorei esse conteúdo! Muito informativo e bem explicado."
- "Que trabalho incrível! A qualidade das fotos está perfeita."
- "Conteúdo super útil, vou aplicar essas dicas. Obrigado!"

❌ **Exemplos de comentários que serão rejeitados:**
- "Legal" / "Top" / "👍" / "❤️"
- Comentários sem sentido ou irrelevantes
- Spam ou propaganda`;
    }
  }

  // Facebook Tasks
  if (job.facebook || subcategory.includes('facebook')) {
    if (job.facebook?.actionType === 'follow') {
      return `📘 **Como completar esta tarefa:**

1. Clique no botão "Seguir Página" para abrir a página do Facebook
2. Clique no botão "Seguir" ou "Curtir" na página
3. Aguarde pelo menos 10 segundos na página
4. Tire um screenshot mostrando que você está seguindo a página
5. Envie o screenshot como prova
6. O contratante irá revisar sua submissão

⚠️ **Importante:** O screenshot deve mostrar claramente que você segue/curtiu a página!`;
    } else if (job.facebook?.actionType === 'like') {
      return `📘 **Como completar esta tarefa:**

1. Clique no link fornecido para abrir o post do Facebook
2. Clique no botão "Curtir" (👍) no post
3. Tire um screenshot mostrando que você curtiu o post
4. Envie o screenshot como prova
5. O contratante irá revisar sua submissão

⚠️ **Importante:** O screenshot deve mostrar a curtida ativa no post!`;
    } else if (job.facebook?.actionType === 'comment') {
      return `📘 **Como completar esta tarefa:**

1. Clique no link fornecido para abrir o post do Facebook
2. Escreva um comentário relevante no post (mínimo 10 caracteres)
3. Publique o comentário
4. Tire um screenshot mostrando seu comentário publicado
5. Envie o screenshot como prova
6. O contratante irá revisar sua submissão

⚠️ **Importante:** O comentário deve ser relevante e respeitoso!`;
    }
  }

  // TikTok Tasks
  if (job.tiktok || subcategory.includes('tiktok')) {
    const action = job.tiktok?.actionType || 'watch';
    
    if (action === 'watch') {
      return `🎵 **COMO ASSISTIR VÍDEO NO TIKTOK:**

**Passo a Passo:**
1. 📱 Clique no botão "Abrir Vídeo" para abrir o vídeo do TikTok
2. ▶️ Assista ao vídeo completo do início ao fim
3. ⏱️ Aguarde pelo menos ${job.tiktok?.viewTimeSeconds || 30} segundos
4. 🔄 Se o vídeo for curto, assista novamente até completar o tempo mínimo
5. 📸 Tire um screenshot mostrando o vídeo na tela
6. ✅ Clique em "Confirmar Visualização" abaixo
7. 📤 Envie o screenshot e o link do vídeo nos campos de prova

**O que seu screenshot DEVE mostrar:**
- O vídeo do TikTok visível na tela
- Nome do criador (@usuario) visível
- Contadores de curtidas/comentários/compartilhamentos

**Links necessários:**
- 🔗 URL do vídeo que você assistiu (copie da barra de endereços)

⚠️ **AVISOS IMPORTANTES:**
- NÃO feche o vídeo antes de completar o tempo mínimo
- Assista com atenção ao conteúdo completo
- Screenshots borrados ou incompletos serão rejeitados
- Aguarde a aprovação do contratante antes de receber pagamento

💡 **Dica:** Vídeos muito curtos devem ser assistidos mais de uma vez!`;
    }
    
    if (action === 'follow') {
      return `🎵 **COMO SEGUIR PERFIL NO TIKTOK:**

**Passo a Passo:**
1. 📱 Clique no botão "Abrir Perfil" para abrir o perfil do TikTok
2. 👤 Localize o botão "Seguir" (vermelho) no perfil
3. ➕ Clique no botão "Seguir"
4. ⏳ Aguarde 5-10 segundos para confirmar que está seguindo
5. 🔄 Atualize a página se necessário para ver "Seguindo"
6. 📸 Tire um screenshot mostrando que você está seguindo o perfil
7. ✅ Clique em "Confirmar Seguimento" abaixo
8. 📤 Envie o screenshot e o link do perfil nos campos de prova

**O que seu screenshot DEVE mostrar:**
- O botão "Seguindo" ativo (não mais "Seguir")
- O nome do perfil (@usuario) completo visível
- Contadores de seguidores e seguindo
- Bio do perfil (se visível)

**Links necessários:**
- 🔗 URL do perfil que você seguiu (copie da barra de endereços)

⚠️ **AVISOS IMPORTANTES:**
- Certifique-se de que o botão mudou para "Seguindo"
- NÃO deixe de seguir o perfil após enviar a prova
- Screenshots que não mostram "Seguindo" serão rejeitados
- Aguarde a aprovação do contratante antes de receber pagamento

💡 **Dica:** Se já segue o perfil, deixe de seguir primeiro e depois siga novamente!`;
    }
    
    if (action === 'like') {
      return `🎵 **COMO CURTIR VÍDEO NO TIKTOK:**

**Passo a Passo:**
1. 📱 Clique no botão "Abrir Vídeo" para abrir o vídeo do TikTok
2. ❤️ Localize o ícone de coração no lado direito do vídeo
3. 👆 Clique no coração para curtir o vídeo
4. ⏳ Aguarde o coração ficar vermelho (confirmação visual)
5. 📸 Tire um screenshot mostrando a curtida ativa
6. ✅ Clique em "Confirmar Curtida" abaixo
7. 📤 Envie o screenshot e o link do vídeo nos campos de prova

**O que seu screenshot DEVE mostrar:**
- O coração VERMELHO (curtida ativa)
- O vídeo completo visível na tela
- Contador de curtidas atualizado
- Nome do criador (@usuario) visível

**Links necessários:**
- 🔗 URL do vídeo que você curtiu (copie da barra de endereços)

⚠️ **AVISOS IMPORTANTES:**
- O coração DEVE estar VERMELHO no screenshot
- NÃO tire screenshot antes de curtir
- NÃO remova a curtida após enviar a prova
- Screenshots sem coração vermelho serão rejeitados
- Aguarde a aprovação do contratante antes de receber pagamento

💡 **Dica:** Você pode dar duplo toque no vídeo para curtir rapidamente!`;
    }
    
    if (action === 'comment') {
      const minChars = job.tiktok?.minCommentLength || 20;
      return `🎵 **COMO COMENTAR VÍDEO NO TIKTOK:**

**Passo a Passo:**
1. 📱 Clique no botão "Abrir Vídeo" para abrir o vídeo do TikTok
2. 💬 Clique no ícone de comentário (balão de fala) no lado direito
3. ✍️ Escreva um comentário relevante e positivo (mínimo ${minChars} caracteres)
4. 📝 Certifique-se de que o comentário faz sentido com o vídeo
5. ➡️ Publique o comentário clicando em "Publicar"
6. ⏳ Aguarde o comentário aparecer na lista de comentários
7. 📸 Tire um screenshot mostrando seu comentário publicado
8. 📋 Copie o TEXTO COMPLETO do seu comentário
9. ✅ Clique em "Confirmar Comentário" abaixo
10. 📤 Envie o screenshot, texto do comentário e link do vídeo

**O que seu screenshot DEVE mostrar:**
- Seu comentário publicado E VISÍVEL na lista
- Seu nome de usuário (@seu_usuario) ao lado do comentário
- O vídeo ou contexto do TikTok visível

**Informações necessárias:**
- 🔗 URL do vídeo que você comentou
- 📝 Texto COMPLETO do seu comentário

⚠️ **AVISOS IMPORTANTES:**
- Comentários genéricos ("Legal!", "👍", "Top") serão REJEITADOS
- O comentário deve ter pelo menos ${minChars} caracteres
- NÃO copie comentários de outras pessoas
- NÃO use spam, emojis apenas ou linguagem ofensiva
- NÃO delete o comentário após enviar a prova
- Aguarde a aprovação do contratante antes de receber pagamento

💡 **Exemplos de bons comentários:**
- "Que vídeo incrível! Adorei a criatividade e edição perfeita."
- "Muito útil esse conteúdo! Vou experimentar essas dicas."
- "Sensacional! A transição ficou perfeita, parabéns pelo trabalho!"

❌ **Exemplos de comentários que serão rejeitados:**
- "Legal" / "Top" / "👍" / "❤️" / "🔥"
- Comentários sem sentido ou irrelevantes
- Spam ou propaganda`;
    }
    
    if (action === 'share') {
      return `🎵 **COMO COMPARTILHAR VÍDEO NO TIKTOK:**

**Passo a Passo:**
1. 📱 Clique no botão "Abrir Vídeo" para abrir o vídeo do TikTok
2. 🔄 Clique no ícone de compartilhar (seta) no lado direito do vídeo
3. 📋 Escolha a opção de compartilhamento solicitada pelo contratante
4. ✅ Confirme o compartilhamento
5. ⏳ Aguarde a confirmação visual do compartilhamento
6. 📸 Tire um screenshot mostrando que você compartilhou
7. 🔗 Se compartilhou em outra rede, copie o link do post compartilhado
8. ✅ Clique em "Confirmar Compartilhamento" abaixo
9. 📤 Envie o screenshot e links necessários nos campos de prova

**O que seu screenshot DEVE mostrar:**
- Confirmação visual de compartilhamento realizado
- Nome do criador do vídeo original
- Sua ação de compartilhamento visível

**Links necessários:**
- 🔗 URL do vídeo original do TikTok
- 🔗 URL do seu compartilhamento (se aplicável)

⚠️ **AVISOS IMPORTANTES:**
- Siga exatamente o método de compartilhamento solicitado
- NÃO delete o compartilhamento após enviar a prova
- Screenshots devem mostrar claramente o compartilhamento
- Aguarde a aprovação do contratante antes de receber pagamento

💡 **Dica:** Verifique se seu perfil está público para compartilhamentos!`;
    }
  }

  // VK Tasks
  if (job.vk || subcategory.includes('vk')) {
    return `🌐 **Como completar esta tarefa:**

1. Clique no link fornecido para abrir o conteúdo no VK
2. Realize a ação solicitada (seguir, curtir, compartilhar, etc.)
3. Tire um screenshot mostrando que você completou a ação
4. Envie o screenshot como prova
5. O contratante irá revisar sua submissão

⚠️ **Importante:** O screenshot deve mostrar claramente a ação completada!`;
  }

  // Website Tasks
  if (job.website || (category === 'web' && subcategory.includes('website'))) {
    if (job.website?.actionType === 'visit') {
      return `🌐 **Como completar esta tarefa:**

1. Clique no botão "Visitar Website" para abrir o site
2. Navegue pelo site por pelo menos ${job.website?.viewTimeSeconds || 10} segundos
3. Aguarde até que o tempo mínimo seja completado
4. Envie a prova solicitada
5. O contratante irá revisar sua submissão

⚠️ **Importante:** Mantenha a aba do site aberta durante todo o tempo!`;
    } else if (job.website?.actionType === 'visit_scroll') {
      return `🌐 **Como completar esta tarefa:**

1. Clique no botão "Visitar Website" para abrir o site
2. Role a página até o final (scroll completo)
3. Permaneça no site por pelo menos ${job.website?.viewTimeSeconds || 10} segundos
4. Envie a prova solicitada
5. O contratante irá revisar sua submissão

⚠️ **Importante:** Você deve rolar até o final da página E aguardar o tempo mínimo!`;
    }
  }

  // Twitter/X Tasks
  if (job.twitter || subcategory.includes('twitter') || subcategory.includes('x (twitter)')) {
    const action = job.twitter?.actionType || 'follow';
    
    if (action === 'follow') {
      return `🐦 **COMO SEGUIR NO TWITTER/X:**

1. Abra o link do perfil fornecido
2. Clique no botão "Seguir" ou "Follow"
3. Aguarde a confirmação visual
4. Tire um screenshot mostrando que você seguiu
5. Cole o link do perfil
6. Envie as provas

⚠️ **Importante:** O screenshot deve mostrar claramente que você está seguindo o perfil!`;
    }
    
    if (action === 'like') {
      return `❤️ **COMO CURTIR TWEET:**

1. Abra o link do tweet
2. Clique no coração para curtir
3. Aguarde o coração ficar vermelho
4. Tire um screenshot
5. Cole o link do tweet
6. Envie as provas

⚠️ **Importante:** O screenshot deve mostrar o coração vermelho (curtida ativa)!`;
    }
    
    if (action === 'retweet') {
      return `🔄 **COMO DAR RETWEET:**

1. Abra o link do tweet
2. Clique no ícone de retweet
3. Confirme a ação
4. Tire um screenshot do retweet confirmado
5. Cole o link do tweet E do seu perfil
6. Envie as provas

⚠️ **Importante:** O screenshot deve mostrar claramente que você retweetou!`;
    }
    
    if (action === 'comment') {
      const minChars = job.twitter?.minCommentLength || 50;
      return `💬 **COMO COMENTAR TWEET:**

1. Abra o link do tweet
2. Escreva um comentário relevante (mínimo ${minChars} caracteres)
3. Publique o comentário
4. Tire um screenshot do comentário publicado
5. Copie o TEXTO do comentário
6. Cole o link do tweet E do seu comentário
7. Envie todas as provas

⚠️ **Importante:** O comentário deve ser relevante e respeitoso!`;
    }
  }

  // Generic tasks based on subcategory
  if (subcategory.includes('curtir') || subcategory.includes('like')) {
    return `👍 **Como completar esta tarefa:**

1. Clique no link fornecido para abrir o conteúdo
2. Clique no botão de curtir/like
3. Tire um screenshot mostrando que você curtiu
4. Envie o screenshot como prova
5. O contratante irá revisar sua submissão

⚠️ **Importante:** O screenshot deve mostrar claramente a curtida ativa!`;
  }

  if (subcategory.includes('seguir') || subcategory.includes('follow')) {
    return `➕ **Como completar esta tarefa:**

1. Clique no link fornecido para abrir o perfil/página
2. Clique no botão "Seguir" ou "Follow"
3. Tire um screenshot mostrando que você está seguindo
4. Envie o screenshot como prova
5. O contratante irá revisar sua submissão

⚠️ **Importante:** O screenshot deve mostrar claramente que você está seguindo!`;
  }

  if (subcategory.includes('inscrever') || subcategory.includes('subscribe')) {
    return `📝 **Como completar esta tarefa:**

1. Clique no link fornecido para abrir a página/canal
2. Clique no botão "Inscrever-se" ou "Subscribe"
3. Tire um screenshot mostrando que você está inscrito
4. Envie o screenshot como prova
5. O contratante irá revisar sua submissão

⚠️ **Importante:** O screenshot deve mostrar claramente que você está inscrito!`;
  }

  if (subcategory.includes('comentar') || subcategory.includes('comment')) {
    return `💬 **Como completar esta tarefa:**

1. Clique no link fornecido para abrir o conteúdo
2. Escreva um comentário relevante e respeitoso
3. Publique o comentário
4. Tire um screenshot mostrando seu comentário publicado
5. Envie o screenshot como prova
6. O contratante irá revisar sua submissão

⚠️ **Importante:** Escreva comentários genuínos e relevantes!`;
  }

  if (subcategory.includes('compartilhar') || subcategory.includes('share')) {
    return `🔄 **Como completar esta tarefa:**

1. Clique no link fornecido para abrir o conteúdo
2. Clique no botão de compartilhar
3. Compartilhe o conteúdo (público ou com amigos, conforme solicitado)
4. Tire um screenshot mostrando que você compartilhou
5. Envie o screenshot como prova
6. O contratante irá revisar sua submissão

⚠️ **Importante:** O screenshot deve mostrar claramente o compartilhamento!`;
  }

  // Default instructions
  return `📋 **Como completar esta tarefa:**

1. Leia cuidadosamente a descrição da tarefa acima
2. Execute todas as ações solicitadas pelo contratante
3. Colete as provas necessárias (screenshots, links, textos)
4. Envie todas as provas solicitadas nos campos abaixo
5. Aguarde a revisão do contratante

⚠️ **Importante:** 
- Certifique-se de completar TODAS as etapas antes de enviar
- Envie provas claras e legíveis
- Seja honesto - provas falsas resultarão em rejeição`;
};

// Helper function para obter URLs dos provedores
function getProviderUrl(provider?: string): string {
  const urls: Record<string, string> = {
    gmail: 'https://accounts.google.com/signup',
    outlook: 'https://signup.live.com',
    yahoo: 'https://login.yahoo.com/account/create',
    protonmail: 'https://account.proton.me/signup',
  };
  return provider ? (urls[provider.toLowerCase()] || 'site do provedor') : 'site do provedor';
}
