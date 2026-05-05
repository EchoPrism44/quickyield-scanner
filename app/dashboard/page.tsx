import { DashboardApp } from '../../components/dashboard-app'
import { getInitialDashboardData } from '../../lib/dashboard'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const data = await getInitialDashboardData()
  return <DashboardApp initialData={data} />
}
