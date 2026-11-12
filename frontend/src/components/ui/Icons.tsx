import type { SVGProps } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Coins,
  Copy,
  CreditCard,
  Dices,
  Download,
  Home,
  ImageOff,
  ImagePlus,
  KeyRound,
  Layers,
  LogOut,
  MessageCircle,
  Phone,
  Play,
  Plus,
  RefreshCw,
  Save,
  Send,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  SquarePlus,
  Upload,
  User,
  Users,
  X,
  XCircle,
} from "lucide-react";

type SvgIconProps = SVGProps<SVGSVGElement>;

export function GardoonLogo({
  size = 38,
  className,
  ...props
}: SvgIconProps & { size?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      aria-label="گردون"
      className={className}
      {...props}
    >
      <defs>
        <radialGradient id="grdGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C6F432" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#16A34A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="grdLime" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D7FF4A" />
          <stop offset="55%" stopColor="#A6E62E" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
        <linearGradient id="grdSun" x1="20" y1="20" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FCED96" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>

      <rect width="64" height="64" rx="18" fill="#0B1610" />
      <rect x="1" y="1" width="62" height="62" rx="17" stroke="#C6F432" strokeOpacity="0.22" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="24" fill="url(#grdGlow)" />

      {/* 3 balanced orbital segments representing community ROSCA cycle */}
      <path
        d="M32 10.5A21.5 21.5 0 0 1 51.2 22.3"
        stroke="url(#grdLime)"
        strokeWidth="4.4"
        strokeLinecap="round"
      />
      <path
        d="M50.6 42.8A21.5 21.5 0 0 1 25.5 52.5"
        stroke="url(#grdLime)"
        strokeWidth="4.4"
        strokeLinecap="round"
      />
      <path
        d="M14.2 44.1A21.5 21.5 0 0 1 22.1 13"
        stroke="#34D399"
        strokeOpacity="0.85"
        strokeWidth="4.4"
        strokeLinecap="round"
      />

      {/* Inner sun ring & hub */}
      <circle
        cx="32"
        cy="32"
        r="11.2"
        stroke="url(#grdSun)"
        strokeOpacity="0.85"
        strokeWidth="2.2"
        strokeDasharray="18 8"
      />
      <circle cx="32" cy="32" r="5.2" fill="#C6F432" />
    </svg>
  );
}

export {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Coins,
  Copy,
  CreditCard,
  Dices,
  Download,
  Home,
  ImageOff,
  ImagePlus,
  KeyRound,
  Layers,
  LogOut,
  MessageCircle,
  Phone,
  Play,
  Plus,
  RefreshCw,
  Save,
  Send,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  SquarePlus,
  Upload,
  User,
  Users,
  X,
  XCircle,
};
