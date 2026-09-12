export default function Home() {
  async function submit() { 'use server'; }
  return <form action={submit}><button type="submit">Submit</button></form>;
}
