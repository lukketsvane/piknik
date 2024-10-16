import MatMix from '@/components/matmix'

export default function SessionPage({ params }: { params: { code: string } }) {
  return <MatMix sessionCode={params.code} />
}