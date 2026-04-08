export default function Home() {
  return (
    <section className="card">
      <h2>Inicio</h2>
      <p>
        Sistema de gestión de eventos con roles. El superusuario administra eventos; el usuario estándar solo visualiza eventos y compra boletos.
      </p>
      <ol>
        <li>Configura variables en <code>.env.local</code> (Supabase y Stripe).</li>
        <li>Ejecuta <code>supabase/setup.sql</code> para crear tablas, perfiles y trigger.</li>
        <li>Cualquier nuevo registro queda como <code>usuario</code> por defecto.</li>
        <li>Los productos extra manuales se editan en <code>lib/manualProducts.ts</code>.</li>
        <li>Promueve tu cuenta a superusuario con el <code>UPDATE</code> incluido en ese script.</li>
      </ol>
    </section>
  );
}
