"use client";

/** Aviso de coordinación de envío en Rosario (sin elegir día/horario). */
export function RosarioDeliveryFields({ className = "" }: { className?: string }) {
  return (
    <div
      className={`border border-black/10 bg-[#f5f4f0] px-4 py-3 text-sm text-soft ${className}`}
    >
      <p className="font-semibold text-[#222222]">Envío en Rosario</p>
      <p className="mt-1">
        Una vez aprobado el pago, nos vamos a comunicar con vos, para pactar el
        día y horario de entrega.
      </p>
    </div>
  );
}
