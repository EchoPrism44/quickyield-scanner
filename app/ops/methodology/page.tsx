import { BANDS, WEIGHTS } from '../../../lib/grade'

export default function OperationsMethodologyPage() {
  return <main className="qy-analytics"><div className="qy-container"><div className="qy-analytics-head"><div><span className="qy-overline qy-overline-signal">Internal reference</span><h1 className="qy-h2">Methodology controls</h1><p className="qy-analytics-sub">These values are read directly from the scoring code used by live grades.</p></div></div><div className="ql-ops-methodology"><section><h2>Signal weights</h2>{Object.entries(WEIGHTS).map(([name, weight]) => <div className="ql-ops-method-row" key={name}><span>{name}</span><strong>{Math.round(weight * 100)}%</strong></div>)}</section><section><h2>Grade bands</h2>{BANDS.map((band) => <div className="ql-ops-method-row" key={band.letter}><span>{band.letter} · {band.label}</span><strong>{band.min}+</strong></div>)}</section></div></div></main>
}
