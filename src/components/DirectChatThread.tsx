import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useDirectChat } from '@/hooks/useDirectChat';
import { Check, CheckCheck } from 'lucide-react';

interface DirectChatThreadProps {
  recipientUserId: string;
  disabled?: boolean;
}

const DirectChatThread = ({ recipientUserId, disabled }: DirectChatThreadProps) => {
  const { t } = useTranslation();
  const { messages, loading, sendMessage, currentUserId, otherTyping, setTyping } = useDirectChat(recipientUserId);
  const [text, setText] = useState('');
  useEffect(() => {
    // set typing based on input presence
    setTyping(!!text.trim());
  }, [text]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    await sendMessage(trimmed);
    setText('');
  };

  return (
    <Card className="mt-3 bg-muted/20 border-border">
      <CardContent className="p-3">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {loading && <div className="text-sm text-muted-foreground">{t('loading_messages')}</div>}
          {!loading && messages.length === 0 && (
            <div className="text-sm text-muted-foreground">{t('no_messages_yet')}</div>
          )}
          {messages.map((msg) => {
            const mine = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-3 py-2 rounded-lg text-sm max-w-[75%] ${mine ? 'bg-primary/20 text-foreground' : 'bg-background border border-border text-foreground'}`}>
                  {!mine && <div className="font-semibold text-xs mb-1">{msg.senderName}</div>}
                  <div>{msg.text}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <span>{new Date(msg.createdAt).toLocaleString()}</span>
                    {mine && (
                      msg.readAt ? <CheckCheck className="h-3 w-3 text-primary" /> : <Check className="h-3 w-3" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {otherTyping && (
            <div className="text-xs text-muted-foreground italic">Digitando…</div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Input
            placeholder={t('type_a_message')}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={disabled}
          />
          <Button onClick={handleSend} disabled={disabled || !text.trim()}>{t('send')}</Button>
        </div>
        {disabled && (
          <div className="text-xs text-muted-foreground mt-2">{t('direct_messages_disabled')}</div>
        )}
      </CardContent>
    </Card>
  );
};

export default DirectChatThread;