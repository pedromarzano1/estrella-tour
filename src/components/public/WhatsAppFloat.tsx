"use client";

import { useState } from "react";
import { MessageCircle, X, ChevronDown } from "lucide-react";

const WA_CONTACTS = [
  { numero: "542324504000", label: "2324-504000", descripcion: "Central Mercedes" },
  { numero: "542324560139", label: "2324-560139", descripcion: "Alternativo Mercedes" },
  { numero: "541122663000", label: "11-22663000", descripcion: "Buenos Aires" },
];

export function WhatsAppFloat() {
  const [open, setOpen] = useState(false);

  const mensaje = encodeURIComponent(
    "Hola Estrella Tour 👋 Quisiera consultar sobre los viajes disponibles."
  );

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-72 overflow-hidden animate-in slide-in-from-bottom-4">
          <div className="bg-green-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold text-sm">Escribinos por WhatsApp</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            <p className="text-xs text-gray-500">Elegí el número según tu zona:</p>
            {WA_CONTACTS.map((c) => (
              <a
                key={c.numero}
                href={`https://wa.me/${c.numero}?text=${mensaje}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-green-50 hover:bg-green-100 transition-colors group"
              >
                <div className="w-9 h-9 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900 group-hover:text-green-700">{c.label}</p>
                  <p className="text-xs text-gray-500">{c.descripcion}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="bg-green-500 hover:bg-green-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
        aria-label="Abrir WhatsApp"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
}
