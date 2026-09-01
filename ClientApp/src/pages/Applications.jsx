import StubPage from '../components/StubPage.jsx'

export default function Applications({ onNavigate }) {
  return (
    <StubPage
      action="Application tracking is coming soon"
      description="Manage university applications and status updates."
      onNavigate={onNavigate}
      title="Applications"
    />
  )
}
