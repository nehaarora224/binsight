import { useRef } from 'react';
import { Icon, Tag } from '../components/ui.jsx';
import { LEVEL_TONE, PRIORITY_TONE, TONE } from '../data.js';

const STEPS = ['Capture', 'Location', 'Assessment', 'Submit'];
const CURRENT_STEP = { capture: 1, analysing: 3, error: 3, result: 4 };

function Stepper({ stage }) {
  const cur = CURRENT_STEP[stage];
  return (
    <ol className="stepper" style={{ margin: 0, listStyle: 'none' }}>
      {STEPS.map((label, i) => {
        const n = i + 1, done = n < cur, now = n === cur;
        const fill = done ? 'var(--green)' : now ? 'var(--ink)' : '#fff';
        return (
          <li key={label} className="stepper-item" aria-current={now ? 'step' : undefined}>
            <div
              className="stepper-dot"
              style={{ background: fill, color: done || now ? '#fff' : 'var(--faint)', borderColor: done || now ? fill : '#C3CAD3' }}
            >
              {done ? '✓' : n}
            </div>
            <div className="stepper-label" style={{ color: done || now ? 'var(--ink)' : 'var(--faint)' }}>{label}</div>
          </li>
        );
      })}
    </ol>
  );
}

function StepCard({ n, title, gap = 10, children }) {
  return (
    <section className="card step-card" style={{ gap }}>
      <div className="step-head">
        <span className="step-kicker">STEP {n}</span>
        <span className="step-title">{title}</span>
      </div>
      {children}
    </section>
  );
}

function LocationStatus({ location }) {
  if (location.status === 'detecting') {
    return <div className="detected" style={{ color: 'var(--muted)' }}><Icon name="crosshair" />Detecting location...</div>;
  }
  if (location.status === 'unavailable') {
    return (
      <div className="detected" style={{ color: 'var(--muted)' }}>
        <Icon name="warning-circle" />GPS unavailable<span style={{ fontWeight: 400, fontSize: 13 }}>· using assigned point</span>
      </div>
    );
  }
  return (
    <div className="detected">
      <Icon name="check-circle" />Location detected
      <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 13 }}>· GPS ±{Math.round(location.accuracy)} m</span>
    </div>
  );
}

export default function Report({
  stage, progress, photo, assessment, error, point, wardLabel, location, submitting,
  onPhoto, onRetake, onRetry, onSubmit,
}) {
  const fileInput = useRef(null);
  const ready = stage === 'result' && !submitting;
  const shownPoint = assessment?.point ?? point;

  const handleFile = e => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) onPhoto(file);
  };

  return (
    <>
      <Stepper stage={stage} />
      <div className="scroll">
        <div className="page">
          <StepCard n={1} title="CAPTURE IMAGE">
            <input ref={fileInput} type="file" accept="image/*" capture="environment" hidden onChange={handleFile} />
            {stage === 'capture' ? (
              <>
                <div className="capture-area">
                  <Icon name="camera" />
                  <strong>Point the camera at the collection point</strong>
                  <div>Keep the full bin area in the frame</div>
                </div>
                <button className="btn btn-green" onClick={() => fileInput.current.click()}>
                  <Icon name="camera" />TAKE PHOTO
                </button>
              </>
            ) : (
              <div className="photo" style={{ backgroundImage: `url(${photo.url})` }}>
                <span className="photo-label mono">{photo.name} · {photo.time}</span>
                <button className="retake" onClick={onRetake}><Icon name="arrow-counter-clockwise" />RETAKE</button>
              </div>
            )}
          </StepCard>

          <StepCard n={2} title="LOCATION" gap={8}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{wardLabel}</div>
              {shownPoint && <div className="note">Near {shownPoint.name}</div>}
            </div>
            <LocationStatus location={location} />
          </StepCard>

          <StepCard n={3} title="AI ASSESSMENT">
            {stage === 'capture' && (
              <div style={{ fontSize: 14, color: 'var(--muted)' }}>Assessment appears after the image is captured.</div>
            )}
            {stage === 'analysing' && (
              <>
                <div style={{ fontSize: 14, fontWeight: 600 }} role="status">Analysing image...</div>
                <div className="bar bar-thin">
                  <div style={{ width: `${progress}%`, background: 'var(--blue)' }} />
                </div>
              </>
            )}
            {stage === 'error' && (
              <>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--red)' }} role="alert">Assessment failed: {error}</div>
                <button className="retake" style={{ alignSelf: 'flex-start' }} onClick={onRetry}>
                  <Icon name="arrow-counter-clockwise" />TRY AGAIN
                </button>
              </>
            )}
            {assessment && stage === 'result' && (
              <>
                <div className="assess">
                  <div className="assess-row"><span>Waste level</span><Tag tone={LEVEL_TONE[assessment.level]}>{assessment.level}</Tag></div>
                  <div className="assess-row"><span>Waste category</span><Tag tone={TONE.grey}>{assessment.category}</Tag></div>
                  <div className="assess-row"><span>Priority</span><Tag tone={PRIORITY_TONE[assessment.priority]}>{assessment.priority}</Tag></div>
                  <div className="assess-row">
                    <span>Recommended action</span>
                    <span style={{ fontSize: 14, fontWeight: 600, textAlign: 'right' }}>{assessment.action}</span>
                  </div>
                </div>
                <div className="small">Generated automatically from the captured image.</div>
              </>
            )}
          </StepCard>

          <StepCard n={4} title="SUBMIT REPORT">
            <button
              className={`btn ${ready ? 'btn-green' : 'btn-disabled'}`}
              aria-disabled={!ready}
              onClick={() => ready && onSubmit()}
            >
              <Icon name="paper-plane-right" />{submitting ? 'SUBMITTING...' : 'SUBMIT REPORT'}
            </button>
            {stage === 'result' && error && <div className="small" style={{ color: 'var(--red)' }} role="alert">{error}</div>}
            {shownPoint && <div className="small">Submitting updates the collection status of Point {String(shownPoint.seq).padStart(2, '0')}.</div>}
          </StepCard>
        </div>
      </div>
    </>
  );
}
