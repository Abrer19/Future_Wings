import StubPage from '../components/StubPage.jsx'

export default function VisaCheck({ onNavigate }) {
  return (
    <StubPage
      action="Visa assessment is coming soon"
      description="Review a preliminary visa risk assessment."
      onNavigate={onNavigate}
      title="Visa Check"
    />
  )
}
