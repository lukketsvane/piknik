import PikNik from '@/components/piknik'

export default function SessionPage({ params }: { params: { code: string } }) {
  return <PikNik sessionCode={params.code} />
}