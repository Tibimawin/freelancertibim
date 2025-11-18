import { useMemo, useState } from 'react';
import { JobComment } from '@/types/firebase';
import { useJobComments } from '@/hooks/useJobComments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface JobCommentsProps {
  jobId: string;
}

const JobComments = ({ jobId }: JobCommentsProps) => {
  const { t } = useTranslation();
  const { comments, loading, addComment, addReply } = useJobComments(jobId);
  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    await addComment(trimmed);
    setText('');
  };

  const grouped = useMemo(() => {
    const parents = comments.filter((c) => !c.parentId);
    const childrenMap: Record<string, JobComment[]> = {} as any;
    for (const c of comments) {
      if (c.parentId) {
        if (!childrenMap[c.parentId]) childrenMap[c.parentId] = [] as any;
        childrenMap[c.parentId].push(c);
      }
    }
    return { parents, childrenMap };
  }, [comments]);

  const handleReplySubmit = async (parentId: string) => {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    await addReply(parentId, trimmed);
    setReplyText('');
    setReplyingTo(null);
  };

  return (
    <Card className="bg-card border-border mt-6">
      <CardHeader>
        <CardTitle className="text-lg">{t('job_comments')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-muted-foreground">{t('comments_are_moderated')}</div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {loading && <div className="text-sm text-muted-foreground">{t('loading_comments')}</div>}
          {!loading && comments.length === 0 && (
            <div className="text-sm text-muted-foreground">{t('no_comments_yet')}</div>
          )}
          {grouped.parents.map((c) => (
            <CommentItem
              key={c.id}
              item={c}
              childrenMap={grouped.childrenMap}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              onSubmitReply={handleReplySubmit}
              t={t}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder={t('type_a_comment')} value={text} onChange={(e) => setText(e.target.value)} />
          <Button onClick={handleSubmit} disabled={!text.trim()}>{t('send')}</Button>
        </div>
      </CardContent>
    </Card>
  );
};

const CommentItem = ({ item, childrenMap, replyingTo, setReplyingTo, replyText, setReplyText, onSubmitReply, t }: {
  item: JobComment;
  childrenMap: Record<string, JobComment[]>;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  replyText: string;
  setReplyText: (v: string) => void;
  onSubmitReply: (parentId: string) => void;
  t: (k: string, opts?: any) => string;
}) => {
  const children = childrenMap[item.id] || [];
  return (
    <div className="p-3 rounded-lg border border-border bg-muted/20">
      <div className="text-sm text-foreground"><span className="font-semibold">{item.userName}:</span> {item.text}</div>
      <div className="text-xs text-muted-foreground mt-1">{new Date(item.createdAt).toLocaleString()}</div>
      <div className="mt-2 flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => setReplyingTo(item.id)}>{t('reply')}</Button>
        {replyingTo === item.id && (
          <Button variant="outline" size="sm" onClick={() => { setReplyingTo(null); setReplyText(''); }}>{t('cancel')}</Button>
        )}
      </div>
      {replyingTo === item.id && (
        <div className="mt-2 flex gap-2">
          <Input placeholder={t('type_a_reply')} value={replyText} onChange={(e) => setReplyText(e.target.value)} />
          <Button onClick={() => onSubmitReply(item.id)} disabled={!replyText.trim()}>{t('send')}</Button>
        </div>
      )}
      {children.length > 0 && (
        <div className="mt-3 ml-6 space-y-3">
          {children.map((r) => (
            <CommentItem
              key={r.id}
              item={r}
              childrenMap={childrenMap}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              onSubmitReply={onSubmitReply}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default JobComments;