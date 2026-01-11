import { CheckCircle } from "lucide-react";
import Image from "next/image";

import onboardingBg from "@/assets/onboarding.jpg";

const features = [
  "Структурирани отговори, базирани на действащото законодателство (в сила към 01.01.2026 г.)",
  "Ясно посочване на приложими разпоредби",
  "Бърза ориентация по често срещани данъчни казуси",
  "24/7 достъпност",
];

export function ProductCard() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Background image */}
      <Image src={onboardingBg} alt="" fill className="object-cover" priority />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-center px-10 py-16">
        {/* Headline */}
        <h2 className="text-3xl font-[700] leading-tight tracking-tight text-white mb-4 drop-shadow-lg">
          Създаден от адвокати
          <br />и счетоводители.
          <span className="block mt-2 pl-2 text-white/80 drop-shadow-md">
            За адвокати и счетоводители.
          </span>
        </h2>

        {/* Features list */}
        <div className="mt-16">
          <p className="text-xs font-medium text-white/80 uppercase tracking-widest mb-5 drop-shadow-sm">
            С нашата AI платформа за данъчно право получавате:
          </p>
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 group">
                <CheckCircle
                  className="h-4 w-4 shrink-0 text-white mt-0.5 drop-shadow-sm"
                  strokeWidth={2}
                />
                <p className="text-sm leading-relaxed text-white/90 drop-shadow-sm">
                  {feature}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom accent */}
        <div className="mt-auto pt-12">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>
      </div>
    </div>
  );
}
