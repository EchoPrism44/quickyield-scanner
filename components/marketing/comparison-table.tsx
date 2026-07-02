import { Check, X } from 'lucide-react'

export function ComparisonTable() {
  const comparisons = [
    {
      feature: 'Real-time Pool Scanning',
      quickyield: true,
      manual: false,
      competitors: 'partial',
    },
    {
      feature: 'Safety Grading System',
      quickyield: true,
      manual: false,
      competitors: false,
    },
    {
      feature: 'Smart Alerts',
      quickyield: true,
      manual: false,
      competitors: 'partial',
    },
    {
      feature: 'Multi-chain Support',
      quickyield: true,
      manual: 'partial',
      competitors: true,
    },
    {
      feature: 'API Access',
      quickyield: true,
      manual: false,
      competitors: true,
    },
    {
      feature: 'Portfolio Tracking',
      quickyield: true,
      manual: 'partial',
      competitors: true,
    },
    {
      feature: 'No Fees',
      quickyield: true,
      manual: true,
      competitors: false,
    },
  ]

  const renderCell = (value: boolean | string) => {
    if (value === true) {
      return (
        <span className="ql-comparison-check">
          <Check size={18} strokeWidth={3} />
        </span>
      )
    }
    if (value === false) {
      return (
        <span className="ql-comparison-cross">
          <X size={18} strokeWidth={2.5} />
        </span>
      )
    }
    return (
      <span className="ql-comparison-partial">
        <Check size={18} strokeWidth={3} />
        <span style={{ fontSize: '11px', marginLeft: '4px' }}>Limited</span>
      </span>
    )
  }

  return (
    <section className="ql-section">
      <div className="ql-wrap">
        <div className="ql-head">
          <span className="ql-eyebrow">Why QuickYield</span>
          <h2 className="ql-h2">Smarter than hunting manually, faster than competitors.</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="ql-comparison-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>QuickYield</th>
                <th>Manual Hunting</th>
                <th>Competitors</th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((row, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{row.feature}</td>
                  <td>{renderCell(row.quickyield)}</td>
                  <td>{renderCell(row.manual)}</td>
                  <td>{renderCell(row.competitors)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
