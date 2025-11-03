'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { QuestionImages } from '@/components/QuestionImages';

type Question = {
  id: number;
  question_text: string;
  option_a: string; option_b: string; option_c: string; option_d: string;
  correctAnswer?: 'A'|'B'|'C'|'D';
  correctanswer?: 'A'|'B'|'C'|'D';
  solution?: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
  QuestionID?: string;  
  questionID?: string;   // quoted column keeps case
  questionid?: string;   // unquoted column lowercased by Postgres
};

export default function Page() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [choice, setChoice] = useState<'A'|'B'|'C'|'D'|null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ correct: boolean; text: string } | null>(null);
  const [answered, setAnswered] = useState(false);

  async function loadRandom() {
    setLoading(true); setError(null);
    setChoice(null);
    setLastResult(null);
    setAnswered(false);
    const { data, error } = await supabase.rpc('get_random_question');
    if (error || !data || data.length === 0) {
      setError(error?.message || 'No question available');
    } else {
      setQuestion(data[0] as Question);
    }
    setLoading(false);
  }

  async function submitAndNext() {
    if (!question) return;

    // First click: grade and show result without advancing
    if (!answered) {
      if (!choice) return;
      setLoading(true); setError(null);

      const keyFromDb = (question.correctAnswer ?? question.correctanswer);
      const key = (keyFromDb ?? question.solution)?.trim()?.toUpperCase() as ('A'|'B'|'C'|'D') | undefined;
      const isCorrect = key ? (choice === key) : false;
      const message = `${isCorrect ? 'Correct' : 'Incorrect'}${question.solution ? ` — ${question.solution}` : ''}`;

      const { error } = await supabase
        .from('responses')
        .insert({ question_id: question.id, selected_option: choice });
      if (error) { setError(error.message); setLoading(false); return; }

      setLastResult({ correct: isCorrect, text: message });
      setAnswered(true);
      setLoading(false);
      return;
    }

    // Second click: advance to next question
    setLoading(true);
    await loadRandom();
    setLoading(false);
  }

  useEffect(() => { loadRandom(); }, []);

  // Resolve and log the public image URL strictly from the exact-cased QuestionID
  const qid = (question as any)?.QuestionID?.trim() ?? null;
  useEffect(() => {
    if (!qid) {
      if (question) {
        console.warn('Question image skipped: missing QuestionID', { dbId: question.id });
      }
      return;
    }
    const { data: pub } = supabase.storage.from('questions').getPublicUrl(`${qid}.png`);
    console.log('Question image resolved', { QuestionID: qid, url: pub?.publicUrl });
  }, [qid]);

  if (error) {
    return (
      <main className="container">
        <p className="error">{error}</p>
        <button onClick={loadRandom} className="btn">Retry</button>
      </main>
    );
  }

  if (!question) return <main className="container">Loading…</main>;

  return (
    <main className="container">
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <img src="/logo.svg" alt="CertSherpa logo" width={200} style={{ height: 'auto' }} />
      </div>

      <h1>{question.question_text}</h1>

      {/* Only use exact-cased QuestionID for image lookup */}
      <QuestionImages
        questionID={qid ?? undefined}
        imageUrl={qid ? `${qid}.png` : null}
        imageAlt={question.imageAlt ?? null}
        // useSignedUrls   // uncomment if your bucket is private
      />

      <div>
        {(['A','B','C','D'] as const).map(k => (
          <label key={k} className={`answer ${choice===k ? 'answer--selected' : ''}`}>
            <input
              type="radio"
              name="opt"
              value={k}
              checked={choice===k}
              onChange={() => setChoice(k)}
              disabled={loading || answered}
            />
            <span>{question[`option_${k.toLowerCase() as 'a'|'b'|'c'|'d'}`]}</span>
          </label>
        ))}
      </div>

      <button onClick={submitAndNext} disabled={loading || (!answered && !choice)} className="btn-primary">
        {loading ? 'Saving…' : (answered ? 'Next question' : 'Next')}
      </button>

      {lastResult && (
        <div className="result" style={{ color: lastResult.correct ? 'var(--success)' : 'var(--danger)' }}>
          {lastResult.text}
        </div>
      )}
    </main>
  );
}
