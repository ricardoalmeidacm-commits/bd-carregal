import logo from "@/assets/museu-logo.png";
import { cn } from "@/lib/utils";

export function Marca({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <img
      src={logo}
      alt="Museu Municipal de Carregal do Sal"
      width={size}
      height={size}
      className={cn("shrink-0 object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}
