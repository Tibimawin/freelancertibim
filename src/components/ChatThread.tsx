import { useState } from 'react';
import { useMessages } from '@/hooks/useMessages';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface ChatThreadProps {
  applicationId: string;
  disabled?: boolean;
}

const ChatThread = ({ applicationId, disabled }: ChatThreadProps) => {
  const { t } = useTranslation();
  const { messages, loading, sendMessage, currentUserId } = useMessages(applicationId);
  const [text, setText] = useState('');

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
                  <div className="text-xs text-muted-foreground mt-1">{new Date(msg.createdAt).toLocaleString()}</div>
                </div>
              </div>
            );
          })}
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

export default ChatThread;