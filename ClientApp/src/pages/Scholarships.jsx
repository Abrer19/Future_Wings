import StubPage from '../components/StubPage.jsx'

export default function Scholarships({ onNavigate }) {
  return (
    <StubPage
      action="The scholarship directory is coming soon"
      description="Find funding opportunities by destination."
      onNavigate={onNavigate}
      title="Scholarships"
    />
  )
}
