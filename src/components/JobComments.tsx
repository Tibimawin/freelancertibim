import { useMemo, useState } from 'react';
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
    const childrenMap: Record<string, typeof comments> = {} as any;
    for (const c of comments) {
      if (c.parentId) {
        if (!childrenMap[c.parentId]) childrenMap[c.parentId] = [] as any;
        (childrenMap[c.parentId] as any).push(c);
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
            <div key={c.id} className="p-3 rounded-lg border border-border bg-muted/20">
              <div className="text-sm text-foreground"><span className="font-semibold">{c.userName}:</span> {c.text}</div>
              <div className="text-xs text-muted-foreground mt-1">{new Date(c.createdAt).toLocaleString()}</div>
              <div className="mt-2 flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setReplyingTo(c.id)}>{t('reply')}</Button>
              </div>
              {replyingTo === c.id && (
                <div className="mt-2 flex gap-2">
                  <Input placeholder={t('type_a_reply')} value={replyText} onChange={(e) => setReplyText(e.target.value)} />
                  <Button onClick={() => handleReplySubmit(c.id)} disabled={!replyText.trim()}>{t('send')}</Button>
                </div>
              )}
              {(grouped.childrenMap[c.id] || []).map((r) => (
                <div key={r.id} className="mt-3 ml-6 p-3 rounded-lg border border-border bg-muted/10">
                  <div className="text-sm text-foreground"><span className="font-semibold">{r.userName}:</span> {r.text}</div>
                  <div className="text-xs text-muted-foreground mt-1">{new Date(r.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
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

export default JobComments;