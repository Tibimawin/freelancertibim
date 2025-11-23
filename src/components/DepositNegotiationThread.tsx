import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Send, Image as ImageIcon, CheckCircle2, MessageSquare, Loader2, Upload, X, ZoomIn } from 'lucide-react';
import { useDepositNegotiationChat } from '@/hooks/useDepositNegotiationChat';
import { useAuth } from '@/contexts/AuthContext';
import { DepositNegotiation } from '@/types/depositNegotiation';
import { DepositNegotiationService } from '@/services/depositNegotiationService';
import { CloudinaryService } from '@/lib/cloudinary';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DepositNegotiationThreadProps {
  negotiation: DepositNegotiation;
  role: 'user' | 'admin';
  onUploadProof?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}

const statusColors: Record<DepositNegotiation['status'], string> = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  negotiating: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  awaiting_payment: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  awaiting_proof: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  approved: 'bg-green-500/10 text-green-600 border-green-500/20',
  rejected: 'bg-red-500/10 text-red-600 border-red-500/20',
  cancelled: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

const quickReplyTemplates = [
  {
    id: 1,
    label: 'Dados Bancários - Express',
    text: 'Por favor, efetue a transferência via Express para:\n\n📱 Número: [INSERIR NÚMERO]\n👤 Titular: [INSERIR NOME]\n\nApós realizar o pagamento, envie o comprovante aqui no chat.'
  },
  {
    id: 2,
    label: 'Dados Bancários - IBAN',
    text: 'Por favor, efetue a transferência bancária para:\n\n🏦 IBAN: [INSERIR IBAN]\n👤 Titular: [INSERIR NOME]\n🏢 Banco: [INSERIR BANCO]\n\nApós realizar o pagamento, envie o comprovante aqui no chat.'
  },
  {
    id: 3,
    label: 'Aguardando Comprovante',
    text: 'Recebi a confirmação do pagamento. Por favor, envie o comprovante para validarmos o depósito. 📸'
  },
  {
    id: 4,
    label: 'Comprovante Recebido',
    text: 'Comprovante recebido! Estamos analisando e em breve confirmaremos o depósito. ✅'
  },
  {
    id: 5,
    label: 'Depósito Aprovado',
    text: 'Parabéns! Seu depósito foi aprovado e o saldo já está disponível em sua carteira. 🎉\n\nValor creditado: [VALOR] Kz'
  },
  {
    id: 6,
    label: 'Solicitar Mais Informações',
    text: 'Para prosseguir com a negociação, preciso de algumas informações adicionais:\n\n• [INFORMAÇÃO 1]\n• [INFORMAÇÃO 2]\n\nPor favor, me informe assim que possível.'
  },
  {
    id: 7,
    label: 'Comprovante Inválido',
    text: 'O comprovante enviado não está legível ou não corresponde aos dados da transferência. Por favor, envie novamente um comprovante mais claro. 📸'
  },
  {
    id: 8,
    label: 'Negociação Concluída',
    text: 'Negociação concluída com sucesso! Se precisar de mais alguma coisa, estou à disposição. 😊'
  }
];

const statusLabels: Record<DepositNegotiation['status'], string> = {
  pending: 'Pendente',
  negotiating: 'Em Negociação',
  awaiting_payment: 'Aguardando Pagamento',
  awaiting_proof: 'Aguardando Comprovante',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  cancelled: 'Cancelado',
};

export const DepositNegotiationThread = ({
  negotiation,
  role,
  onUploadProof,
  onApprove,
  onReject,
}: DepositNegotiationThreadProps) => {
  const { messages, loading, sendMessage, handleTyping, isOtherUserTyping, otherUserName } = useDepositNegotiationChat(negotiation.id);
  const [text, setText] = useState('');
  const { userData } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [zoomImageOpen, setZoomImageOpen] = useState(false);
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    await sendMessage(text, role);
    setText('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    handleTyping();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertTemplate = (templateText: string) => {
    setText(templateText);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas imagens');
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 5MB');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadProof = async () => {
    if (!selectedFile) {
      toast.error('Selecione uma imagem primeiro');
      return;
    }

    setUploadingProof(true);
    setUploadProgress(0);

    try {
      const result = await CloudinaryService.uploadFile(
        selectedFile,
        `deposit-proofs/${negotiation.userId}`,
        (percent) => setUploadProgress(percent)
      );

      // Salvar URL do comprovante na negociação
      await DepositNegotiationService.uploadProof(negotiation.id, result.url);

      // Enviar mensagem informando upload
      await sendMessage('📎 Comprovante de pagamento enviado', role);

      toast.success('Comprovante enviado com sucesso!');
      clearSelectedFile();
    } catch (error) {
      console.error('Error uploading proof:', error);
      toast.error('Erro ao enviar comprovante');
    } finally {
      setUploadingProof(false);
      setUploadProgress(0);
    }
  };

  const openZoomImage = (imageUrl: string) => {
    setZoomImageUrl(imageUrl);
    setZoomImageOpen(true);
  };

  const isCompleted = ['approved', 'rejected', 'cancelled'].includes(negotiation.status);

  return (
    <Card className="h-full flex flex-col bg-gradient-to-br from-background to-muted/20 border-border/50">
      <CardHeader className="border-b border-border/50 bg-background/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Negociação de Depósito
          </CardTitle>
          <Badge className={cn('border', statusColors[negotiation.status])}>
            {statusLabels[negotiation.status]}
          </Badge>
        </div>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Valor Solicitado:</span>
            <span className="font-semibold text-lg text-primary">
              {negotiation.requestedAmount.toFixed(2)} Kz
            </span>
          </div>
          {negotiation.agreedAmount && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Valor Acordado:</span>
              <span className="font-semibold text-lg text-green-600">
                {negotiation.agreedAmount.toFixed(2)} Kz
              </span>
            </div>
          )}
          {negotiation.agreedMethod && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Método:</span>
              <span className="font-medium capitalize">{negotiation.agreedMethod}</span>
            </div>
          )}
          {negotiation.agreedFee && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Taxa:</span>
              <span className="font-medium">{negotiation.agreedFee.toFixed(2)} Kz</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && (
            <div className="text-center text-muted-foreground text-sm py-8">
              Carregando mensagens...
            </div>
          )}
          
          {!loading && messages.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8">
              <p className="mb-2">Nenhuma mensagem ainda</p>
              <p className="text-xs">Inicie a negociação enviando uma mensagem</p>
            </div>
          )}

          {messages.map((msg) => {
            const isMyMessage = msg.senderRole === role;
            const isAdmin = msg.senderRole === 'admin';

            return (
              <div
                key={msg.id}
                className={cn(
                  'flex items-end gap-2 animate-in fade-in slide-in-from-bottom-2',
                  isMyMessage ? 'justify-end' : 'justify-start'
                )}
              >
                {!isMyMessage && (
                  <Avatar className="h-8 w-8 ring-2 ring-background shadow-sm">
                    <AvatarFallback className={isAdmin ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                      {msg.senderName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={cn(
                    'px-4 py-2.5 rounded-2xl max-w-[75%] shadow-sm',
                    isMyMessage
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : isAdmin
                      ? 'bg-accent text-accent-foreground rounded-bl-sm border border-border/50'
                      : 'bg-muted text-foreground rounded-bl-sm border border-border/50'
                  )}
                >
                  {!isMyMessage && (
                    <div className="text-xs font-semibold mb-1 opacity-70">
                      {msg.senderName}
                    </div>
                  )}
                  <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {msg.text}
                  </div>
                  <div className={cn(
                    'text-xs mt-1.5 flex items-center gap-1',
                    isMyMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  )}>
                    {new Date(msg.createdAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                {isMyMessage && (
                  <Avatar className="h-8 w-8 ring-2 ring-background shadow-sm">
                    <AvatarImage src={userData?.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {(userData?.name || 'Você').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })}
          
          {isOtherUserTyping && (
            <div className="flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2">
              <Avatar className="h-8 w-8 ring-2 ring-background shadow-sm">
                <AvatarFallback className="bg-muted">
                  {otherUserName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm bg-muted border border-border/50 shadow-sm">
                <div className="text-xs font-semibold mb-1 opacity-70">
                  {otherUserName}
                </div>
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Action Buttons (for user) */}
        {role === 'user' && !isCompleted && (
          <div className="border-t border-border/50 bg-muted/30 p-3">
            <div className="flex flex-col gap-3">
              {/* Upload Section - Always visible for active negotiations */}
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {!selectedFile ? (
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {negotiation.proofUrl ? 'Enviar Novo Comprovante' : 'Enviar Comprovante'}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    {/* Preview */}
                    <div className="relative rounded-lg overflow-hidden border border-border bg-muted/50">
                      <img
                        src={previewUrl || ''}
                        alt="Preview"
                        className="w-full h-32 object-cover"
                      />
                      <Button
                        onClick={clearSelectedFile}
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {/* Upload Button */}
                    <Button
                      onClick={handleUploadProof}
                      disabled={uploadingProof}
                      className="w-full gap-2 bg-green-600 hover:bg-green-700"
                    >
                      {uploadingProof ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Enviando... {uploadProgress}%
                        </>
                      ) : (
                        <>
                          <ImageIcon className="h-4 w-4" />
                          Enviar Comprovante
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Proof Display */}
              {negotiation.proofUrl && (
                <div className="p-3 bg-background rounded-lg border border-green-500/20">
                  <p className="text-xs text-muted-foreground mb-2">Comprovante enviado:</p>
                  <div 
                    className="relative group cursor-pointer"
                    onClick={() => openZoomImage(negotiation.proofUrl!)}
                  >
                    <img
                      src={negotiation.proofUrl}
                      alt="Comprovante"
                      className="w-full rounded border border-border group-hover:opacity-80 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded">
                      <ZoomIn className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Admin Action Buttons */}
        {role === 'admin' && !isCompleted && (
          <div className="border-t border-border/50 bg-muted/30 p-3">
            <div className="space-y-3">
              {/* Proof Display for Admin */}
              {negotiation.proofUrl && (
                <div className="p-3 bg-background rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground mb-2 font-semibold">Comprovante do usuário:</p>
                  <div 
                    className="relative group cursor-pointer"
                    onClick={() => openZoomImage(negotiation.proofUrl!)}
                  >
                    <img
                      src={negotiation.proofUrl}
                      alt="Comprovante"
                      className="w-full rounded border border-border group-hover:opacity-80 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded">
                      <ZoomIn className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {negotiation.status === 'awaiting_proof' && negotiation.proofUrl && (
                  <>
                    <Button
                      onClick={onApprove}
                      variant="default"
                      size="sm"
                      className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Aprovar e Creditar
                    </Button>
                    <Button
                      onClick={onReject}
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                    >
                      Rejeitar
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Message Input */}
        {!isCompleted && (
          <div className="border-t border-border/50 bg-background/50 backdrop-blur-sm p-4">
            <div className="flex items-end gap-2">
              {role === 'admin' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 shrink-0"
                      title="Mensagens Rápidas"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="start" 
                    className="w-80 max-h-96 overflow-y-auto bg-background border-border shadow-lg z-50"
                  >
                    {quickReplyTemplates.map((template) => (
                      <DropdownMenuItem
                        key={template.id}
                        onClick={() => insertTemplate(template.text)}
                        className="cursor-pointer hover:bg-accent focus:bg-accent p-3"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-sm">{template.label}</span>
                          <span className="text-xs text-muted-foreground line-clamp-2">
                            {template.text}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              <div className="flex-1">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={text}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  className="resize-none bg-background"
                />
              </div>
              <Button
                onClick={handleSend}
                disabled={!text.trim()}
                size="icon"
                className="h-10 w-10 shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {isCompleted && (
          <div className="border-t border-border/50 bg-muted/30 p-4 text-center text-sm text-muted-foreground">
            Negociação finalizada
          </div>
        )}
      </CardContent>

      {/* Zoom Image Modal */}
      <Dialog open={zoomImageOpen} onOpenChange={setZoomImageOpen}>
        <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-background">
          <DialogHeader className="p-6 pb-3">
            <DialogTitle>Comprovante de Pagamento</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-0">
            {zoomImageUrl && (
              <div className="relative">
                <img
                  src={zoomImageUrl}
                  alt="Comprovante - Visualização Ampliada"
                  className="w-full h-auto rounded-lg border border-border"
                />
                <a
                  href={zoomImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-2 right-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-medium hover:bg-primary/90 transition-colors"
                >
                  Abrir Original
                </a>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
