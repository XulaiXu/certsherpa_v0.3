'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

type Question = {
  id: number;
  question_text: string;
  option_a: string; option_b: string; option_c: string; option_d: string;
};

export default function Page() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [choice, setChoice] = useState<'A'|'B'|'C'|'D'|null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadRandom() {
    setLoading(true); setError(null); setChoice(null);
    const { data, error } = await supabase.rpc('get_random_question_ui');
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
    const { error } = await supabase
      .from('responses')
      .insert({ question_id: question.id, selected_option: choice });
    if (error) { setError(error.message); setLoading(false); return; }
    await loadRandom();
  }

  useEffect(() => { loadRandom(); }, []);

  if (error) return (
    <main style={{ padding: 24, maxWidth: 640, margin: '0 auto', fontFamily: 'Calibre, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"' }}>
      <p style={{ color: '#b91c1c', fontSize: 14 }}>{error}</p>
      <button onClick={loadRandom} style={{ marginTop: 12, border: '1px solid #e5e7eb', padding: '8px 12px', background: 'white', cursor: 'pointer' }}>Retry</button>
    </main>
  );

  if (!question) return (
    <main style={{ padding: 24, fontFamily: 'Calibre, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"' }}>
      Loading…
    </main>
  );

  return (
    <main style={{ padding: 24, maxWidth: 640, margin: '0 auto', fontFamily: 'Calibre, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"' }}>
      <h1 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{question.question_text}</h1>
      <div>
        {(['A','B','C','D'] as const).map(k => (
          <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', marginBottom: 8, border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer' }}>
            <input
              type="radio"
              name="opt"
              value={k}
              checked={choice===k}
              onChange={() => setChoice(k)}
              disabled={loading}
              style={{ margin: 0 }}
            />
            <span style={{ fontSize: 14 }}>{question[`option_${k.toLowerCase() as 'a'|'b'|'c'|'d'}`]}</span>
          </label>
        ))}
      </div>
      <button
        onClick={submitAndNext}
        disabled={!choice || loading}
        style={{ display: 'block', marginTop: 12, border: '1px solid #e5e7eb', padding: '10px 16px', background: '#111827', color: 'white', borderRadius: 6, opacity: (!choice || loading) ? 0.6 : 1, cursor: (!choice || loading) ? 'not-allowed' : 'pointer' }}
      >{loading ? 'Saving…' : 'Next'}</button>
    </main>
  );
}


