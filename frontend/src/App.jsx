import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api.js';
import { clock } from './format.js';
import { BottomNav, HomeBar, StatusBar, TitleBar, Tricolor } from './components/Chrome.jsx';
import { Icon } from './components/ui.jsx';
import Home from './screens/Home.jsx';
import Report from './screens/Report.jsx';
import Submitted from './screens/Submitted.jsx';
import Route from './screens/Route.jsx';
import Reports from './screens/Reports.jsx';
import More from './screens/More.jsx';

const SCREENS = ['home', 'report', 'route', 'reports', 'more'];
const ANALYSIS_MS = 1540;

const screenFromHash = () => {
  const s = window.location.hash.replace(/^#\/?/, '');
  return SCREENS.includes(s) ? s : 'home';
};

function Message({ children, onRetry }) {
  return (
    <div className="scroll">
      <div className="page" style={{ alignItems: 'center', paddingTop: 48, gap: 12, textAlign: 'center' }}>
        {children}
        {onRetry && <button className="btn btn-outline" style={{ width: 200 }} onClick={onRetry}>RETRY</button>}
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState(screenFromHash);
  const [data, setData] = useState(null); // { dashboard, route, reports }
  const [loadError, setLoadError] = useState(null);
  const [busy, setBusy] = useState(false);

  // Report flow. stage: 'capture' | 'analysing' | 'result' | 'error' | 'submitted'
  const [stage, setStage] = useState('capture');
  const [photo, setPhoto] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [report, setReport] = useState(null);
  const [flowError, setFlowError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [analysisStart, setAnalysisStart] = useState(0);
  const [location, setLocation] = useState({ status: 'detecting' });
  const lastFile = useRef(null);

  const [showHindi, setShowHindi] = useState(() => {
    try { return localStorage.getItem('binsight.hindi') === '1'; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem('binsight.hindi', showHindi ? '1' : '0'); } catch { /* storage unavailable */ }
  }, [showHindi]);

  const load = useCallback(async () => {
    try {
      const [dashboard, route, reports] = await Promise.all([api.dashboard(), api.route(), api.reports()]);
      setData({ dashboard, route, reports });
      setLoadError(null);
    } catch (err) {
      setLoadError(err.message);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const onHash = () => setScreen(screenFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = useCallback(next => {
    if (screenFromHash() !== next) window.location.hash = `/${next}`;
    setScreen(next);
  }, []);

  // Detect the worker's position when a new report is started.
  useEffect(() => {
    if (screen !== 'report' || stage !== 'capture') return;
    if (!navigator.geolocation) { setLocation({ status: 'unavailable' }); return; }
    setLocation(l => (l.status === 'ok' ? l : { status: 'detecting' }));
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setLocation({ status: 'ok', lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy }),
      () => setLocation({ status: 'unavailable' }),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, [screen, stage]);

  // The bar runs on elapsed time (so leaving the screen never stalls it) and holds at 95% until the API answers.
  useEffect(() => {
    if (stage !== 'analysing') return;
    const tick = () => {
      const p = Math.min(assessment ? 100 : 95, 5 + (95 * (Date.now() - analysisStart)) / ANALYSIS_MS);
      setProgress(p);
      if (p >= 100) setStage('result');
    };
    tick();
    const id = setInterval(tick, 140);
    return () => clearInterval(id);
  }, [stage, analysisStart, assessment]);

  const replacePhoto = next => setPhoto(prev => {
    if (prev?.url) URL.revokeObjectURL(prev.url);
    return next;
  });

  const runAssessment = async file => {
    setAssessment(null);
    setFlowError(null);
    setAnalysisStart(Date.now());
    setProgress(5);
    setStage('analysing');
    try {
      const result = await api.assess({
        file,
        pointId: data?.dashboard.nextPoint?.id,
        location: location.status === 'ok' ? location : null,
      });
      setAssessment(result);
    } catch (err) {
      setFlowError(err.message);
      setStage('error');
    }
  };

  const takePhoto = file => {
    lastFile.current = file;
    replacePhoto({ url: URL.createObjectURL(file), name: file.name, time: clock() });
    runAssessment(file);
  };

  const resetReport = () => {
    replacePhoto(null);
    setAssessment(null);
    setReport(null);
    setFlowError(null);
    setStage('capture');
  };
  const openReport = () => { if (stage === 'submitted') resetReport(); go('report'); };
  const newReport = () => { resetReport(); go('report'); };

  const submit = async () => {
    setBusy(true);
    setFlowError(null);
    try {
      setReport(await api.submitReport(assessment.id));
      setStage('submitted');
      await load();
    } catch (err) {
      setFlowError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleRoute = async () => {
    setBusy(true);
    try {
      await (data.route.route.startedAt ? api.endRoute() : api.startRoute());
      await load();
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const worker = data?.dashboard.worker;
  const wardLabel = worker ? `${worker.ward} · ${worker.wardName}` : '';
  const activeTab = screen === 'report' ? 'home' : screen;

  let body;
  if (!data) {
    body = loadError
      ? (
        <Message onRetry={load}>
          <Icon name="wifi-slash" style={{ fontSize: 40, color: 'var(--ink-3)' }} />
          <div style={{ fontSize: 16, fontWeight: 700 }}>Could not reach the Binsight server</div>
          <div className="note">{loadError}</div>
        </Message>
      )
      : <Message><div className="note">Loading...</div></Message>;
  } else if (screen === 'home') {
    body = <Home dashboard={data.dashboard} wardLabel={wardLabel} showHindi={showHindi} onRoute={() => go('route')} onReport={openReport} />;
  } else if (screen === 'report' && stage === 'submitted') {
    body = <Submitted report={report} onHome={() => go('home')} onReports={() => go('reports')} />;
  } else if (screen === 'report') {
    body = (
      <Report
        stage={stage} progress={progress} photo={photo} assessment={assessment} error={flowError}
        point={data.dashboard.nextPoint} wardLabel={wardLabel} location={location} submitting={busy}
        onPhoto={takePhoto} onRetake={resetReport} onRetry={() => runAssessment(lastFile.current)} onSubmit={submit}
      />
    );
  } else if (screen === 'route') {
    body = <Route data={data.route} busy={busy} onToggleRoute={toggleRoute} />;
  } else if (screen === 'reports') {
    body = <Reports reports={data.reports} onNewReport={newReport} />;
  } else {
    body = <More worker={worker} showHindi={showHindi} onToggleHindi={() => setShowHindi(v => !v)} />;
  }

  return (
    <div className="stage">
      <div className="phone">
        <StatusBar />
        <Tricolor />
        {screen === 'home'
          ? <HomeBar wardLabel={wardLabel} />
          : <TitleBar screen={screen} wardLabel={wardLabel} showHindi={showHindi} onBack={screen === 'report' ? () => go('home') : null} />}
        <main style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>{body}</main>
        <BottomNav active={activeTab} onNavigate={go} />
      </div>
    </div>
  );
}
