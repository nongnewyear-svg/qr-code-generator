import QRCodeGenerator from "@/components/QRCodeGenerator";

export default function Home() {
  return (
    <>
      <div className="floating-orb floating-orb-1" />
      <div className="floating-orb floating-orb-2" />
      <div className="floating-orb floating-orb-3" />
      <main className="relative z-10 min-h-screen">
        <QRCodeGenerator />
      </main>
    </>
  );
}
