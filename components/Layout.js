import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <div className="elora-shell">
      <Navbar />
      <main className="elora-main">{children}</main>
    </div>
  );
}
