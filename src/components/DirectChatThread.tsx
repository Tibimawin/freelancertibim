import { useEffect, useState, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useDirectChat } from '@/hooks/useDirectChat';
import { Check, CheckCheck, Smile, Pin, PinOff } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { AuthService } from '@/services/auth';
import { DirectMessageService } from '@/services/directMessageService';
import EmojiPicker from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

interface DirectChatThreadProps {
  recipientUserId: string;
  disabled?: boolean;
}

const DirectChatThread = ({ recipientUserId, disabled }: DirectChatThreadProps) => {
  const { t } = useTranslation();
  const { messages, loading, sendMessage, currentUserId, otherTyping, setTyping, threadId } = useDirectChat(recipientUserId);
  const [text, setText] = useState('');
  const { userData } = useAuth();
  const [recipientAvatarUrl, setRecipientAvatarUrl] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactionPopover, setReactionPopover] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // set typing based on input presence
    setTyping(!!text.trim());
  }, [text]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (recipientUserId) {
          const u = await AuthService.getUserData(recipientUserId);
          if (mounted) setRecipientAvatarUrl(u?.avatarUrl || null);
        }
      } catch (e) {
        if (mounted) setRecipientAvatarUrl(null);
      }
    };
    load();
    return () => { mounted = false; };
  }, [recipientUserId]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    await sendMessage(trimmed);
    setText('');
  };

  const handleEmojiClick = (emojiData: any) => {
    setText(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!threadId || !currentUserId) return;
    const message = messages.find(m => m.id === messageId);
    if (!message) return;
    
    const currentReaction = message.reactions?.[currentUserId];
    if (currentReaction === emoji) {
      // Remove reaction if clicking the same emoji
      await DirectMessageService.removeReaction(threadId, messageId, currentUserId);
    } else {
      // Add or change reaction
      await DirectMessageService.addReaction(threadId, messageId, currentUserId, emoji);
    }
    setReactionPopover(null);
  };

  const handleTogglePin = async (messageId: string) => {
    if (!threadId || !currentUserId) return;
    const message = messages.find(m => m.id === messageId);
    if (!message) return;
    
    await DirectMessageService.togglePinMessage(threadId, messageId, currentUserId, !message.pinned);
  };

  const pinnedMessages = useMemo(() => messages.filter(m => m.pinned), [messages]);
  const regularMessages = useMemo(() => messages.filter(m => !m.pinned), [messages]);

  const renderMessage = (msg: any, isPinned: boolean = false) => {
    const mine = msg.senderId === currentUserId;
    const reactions = msg.reactions || {};
    const reactionEntries = Object.entries(reactions);
    
    return (
      <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} items-end gap-2 ${isPinned ? 'bg-warning/10 border-l-2 border-warning pl-2' : ''}`}>
        {!mine && (
          <Avatar className="h-6 w-6">
            <AvatarImage src={recipientAvatarUrl || undefined} />
            <AvatarFallback>{(msg.senderName || '?').charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        )}
        <div className="flex flex-col gap-1">
          <div 
            className={`group relative px-3 py-2 rounded-lg text-sm max-w-[75%] ${mine ? 'bg-primary/20 text-foreground' : 'bg-background border border-border text-foreground'}`}
          >
            {isPinned && (
              <div className="flex items-center gap-1 text-xs text-warning mb-1">
                <Pin className="h-3 w-3" />
                <span>Mensagem fixada</span>
              </div>
            )}
            {!mine && <div className="font-semibold text-xs mb-1">{msg.senderName}</div>}
            <div>{msg.text}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <span>{new Date(msg.createdAt).toLocaleString()}</span>
              {mine && (
                msg.readAt ? <CheckCheck className="h-3 w-3 text-primary" /> : <Check className="h-3 w-3" />
              )}
            </div>
            
            {/* Action buttons */}
            <div className="absolute -top-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              {/* Pin/Unpin button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => handleTogglePin(msg.id)}
                title={msg.pinned ? 'Desfixar mensagem' : 'Fixar mensagem'}
              >
                {msg.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
              </Button>
              
              {/* Reaction button */}
              <Popover open={reactionPopover === msg.id} onOpenChange={(open) => setReactionPopover(open ? msg.id : null)}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    <Smile className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="end">
                  <div className="flex gap-1">
                    {['❤️', '👍', '😂', '😮', '😢', '🔥'].map((emoji) => (
                      <Button
                        key={emoji}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-lg hover:scale-125 transition-transform"
                        onClick={() => handleReaction(msg.id, emoji)}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Display reactions */}
          {reactionEntries.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {reactionEntries.reduce<Array<{ emoji: string; userIds: string[] }>>((acc, [userId, emoji]) => {
                const existing = acc.find(r => r.emoji === emoji);
                if (existing) {
                  existing.userIds.push(userId);
                } else {
                  acc.push({ emoji: emoji as string, userIds: [userId] });
                }
                return acc;
              }, [] as Array<{ emoji: string; userIds: string[] }>).map(({ emoji, userIds }) => {
                const isMyReaction = currentUserId && userIds.includes(currentUserId);
                return (
                  <button
                    key={emoji}
                    onClick={() => currentUserId && handleReaction(msg.id, emoji)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all ${
                      isMyReaction 
                        ? 'bg-primary/30 border border-primary' 
                        : 'bg-muted/50 border border-border hover:bg-muted'
                    }`}
                  >
                    <span>{emoji}</span>
                    {userIds.length > 1 && <span className="text-muted-foreground">{userIds.length}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {mine && (
          <Avatar className="h-6 w-6">
            <AvatarImage src={(userData?.avatarUrl) || undefined} />
            <AvatarFallback>{(userData?.name || 'Você').charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  };

  return (
    <Card className="mt-3 bg-muted/20 border-border">
      <CardContent className="p-3">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {loading && <div className="text-sm text-muted-foreground">{t('loading_messages')}</div>}
          {!loading && messages.length === 0 && (
            <div className="text-sm text-muted-foreground">{t('no_messages_yet')}</div>
          )}
          
          {/* Pinned messages section */}
          {pinnedMessages.length > 0 && (
            <>
              <div className="space-y-2">
                {pinnedMessages.map((msg) => renderMessage(msg, true))}
              </div>
              <Separator className="my-3" />
            </>
          )}
          
          {/* Regular messages */}
          {regularMessages.map((msg) => renderMessage(msg, false))}
          {otherTyping && (
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg w-fit">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
              <span className="text-xs text-muted-foreground">Digitando...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" disabled={disabled} className="shrink-0">
                <Smile className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-0" align="start">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </PopoverContent>
          </Popover>
          <Input
            placeholder={t('type_a_message')}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
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