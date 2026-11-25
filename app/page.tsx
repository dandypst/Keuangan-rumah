import { auth, signIn } from "@/auth";
import { loadData } from "@/lib/data";
import { syncOwner } from "@/lib/sync";
import App from "@/components/App";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function Home() {
  const session = await auth();
  if (!session) {
    return (
      <div id="app">
        <h1>Keuangan Rumah</h1>
        <p className="mute">Masuk dengan akun Google yang terdaftar.</p>
        <form action={async () => { "use server"; await signIn("google"); }}>
          <button className="btn pr">Masuk dengan Google</button>
        </form>
      </div>
    );
  }
  await syncOwner().catch(() => null); // tarik email Jago baru
  return <App data={await loadData()} />;
}
