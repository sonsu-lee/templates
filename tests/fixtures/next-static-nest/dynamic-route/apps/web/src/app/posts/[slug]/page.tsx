export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <main>{(await params).slug}</main>;
}
