'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

type Question = {
  id: number;
  question_text: string;
  option_a: string; option_b: string; option_c: string; option_d: string;
  correctAnswer?: 'A'|'B'|'C'|'D';
  solution?: string;
};

export default function Page() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [choice, setChoice] = useState<'A'|'B'|'C'|'D'|null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ correct: boolean; text: string } | null>(null);

  async function loadRandom() {
    setLoading(true); setError(null); setChoice(null);
    const { data, error } = await supabase.rpc('get_random_question');
    if (error || !data || data.length === 0) {
      setError(error?.message || 'No question available');
    } else {
      const q = data[0] as Question;
      setQuestion(q);
    }
    setLoading(false);
  }

  async function submitAndNext() {
    if (!question || !choice) return;
    setLoading(true); setError(null);
    // Determine correctness before we load the next question
    const isCorrect = question.correctAnswer ? (choice === question.correctAnswer) : false;
    const message = `${isCorrect ? 'Correct' : 'Incorrect'}${question.solution ? ` — ${question.solution}` : ''}`;
    const { error } = await supabase
      .from('responses')
      .insert({ question_id: question.id, selected_option: choice });
    if (error) { setError(error.message); setLoading(false); return; }
    setLastResult({ correct: isCorrect, text: message });
    await loadRandom();
  }

  useEffect(() => { loadRandom(); }, []);

  if (error) return (
    <main className="container">
      <p className="error">{error}</p>
      <button onClick={loadRandom} className="btn">Retry</button>
    </main>
  );

  if (!question) return (
    <main className="container">Loading…</main>
  );

  return (
    <main className="container">
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <img src="/logo.svg" alt="CertSherpa logo" width={200} style={{ height: 'auto' }} />
      </div>
      <h1>{question.question_text}</h1>
      <div>
        {(['A','B','C','D'] as const).map(k => (
          <label key={k} className={`answer ${choice===k ? 'answer--selected' : ''}`}>
            <input
              type="radio"
              name="opt"
              value={k}
              checked={choice===k}
              onChange={() => setChoice(k)}
              disabled={loading}
            />
            <span>{question[`option_${k.toLowerCase() as 'a'|'b'|'c'|'d'}`]}</span>
          </label>
        ))}
      </div>
      <button
        onClick={submitAndNext}
        disabled={!choice || loading}
        className="btn-primary"
      >{loading ? 'Saving…' : 'Next'}</button>
      {lastResult && (
        <div className="result" style={{ color: lastResult.correct ? 'var(--success)' : 'var(--danger)' }}>
          {lastResult.text}
        </div>
      )}
    </main>
  );
}


