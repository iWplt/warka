import type { SVGProps } from "react";
import { cn } from "@/lib/utils";
import type { IraqiPaymentMethodId } from "@/lib/payment/iraqi-methods";

type LogoProps = SVGProps<SVGSVGElement> & { className?: string };

/** Uniform 48×48 mark used inside payment method cards. */
function LogoFrame({
  className,
  children,
  bg,
}: {
  className?: string;
  children: React.ReactNode;
  bg: string;
}) {
  return (
    <span
      className={cn(
        "flex size-12 shrink-0 items-center justify-center rounded-xl text-white shadow-sm",
        className
      )}
      style={{ background: bg }}
      aria-hidden
    >
      {children}
    </span>
  );
}

function ZainLogo(props: LogoProps) {
  return (
    <LogoFrame bg="#6B2D7B" className={props.className}>
      <svg viewBox="0 0 32 32" className="size-7" fill="none">
        <path
          d="M8 10h16l-6 6 6 6H8l6-6-6-6Z"
          fill="currentColor"
          className="text-white"
        />
      </svg>
    </LogoFrame>
  );
}

function SuperQiLogo(props: LogoProps) {
  return (
    <LogoFrame bg="#00A651" className={props.className}>
      <svg viewBox="0 0 32 32" className="size-7" fill="none">
        <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="2.5" className="text-white" />
        <path d="M12 16h8M16 12v8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-white" />
      </svg>
    </LogoFrame>
  );
}

function FibLogo(props: LogoProps) {
  return (
    <LogoFrame bg="#0B3D91" className={props.className}>
      <svg viewBox="0 0 32 32" className="size-7" fill="none">
        <rect x="7" y="8" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" className="text-white" />
        <path d="M11 16h10M11 20h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-white" />
      </svg>
    </LogoFrame>
  );
}

function AsiaPayLogo(props: LogoProps) {
  return (
    <LogoFrame bg="#E85D04" className={props.className}>
      <svg viewBox="0 0 32 32" className="size-7" fill="none">
        <path
          d="M16 7 26 23H6L16 7Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          className="text-white"
        />
        <circle cx="16" cy="18" r="2.5" fill="currentColor" className="text-white" />
      </svg>
    </LogoFrame>
  );
}

function CashLogo(props: LogoProps) {
  return (
    <LogoFrame bg="#5C6247" className={props.className}>
      <svg viewBox="0 0 32 32" className="size-7" fill="none">
        <rect x="6" y="10" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2" className="text-white" />
        <circle cx="16" cy="16" r="3" stroke="currentColor" strokeWidth="2" className="text-white" />
      </svg>
    </LogoFrame>
  );
}

export function PaymentMethodLogo({
  method,
  className,
}: {
  method: IraqiPaymentMethodId;
  className?: string;
}) {
  switch (method) {
    case "zain_cash":
      return <ZainLogo className={className} />;
    case "super_qi":
      return <SuperQiLogo className={className} />;
    case "fib":
      return <FibLogo className={className} />;
    case "asiapay":
      return <AsiaPayLogo className={className} />;
    case "cash":
      return <CashLogo className={className} />;
  }
}
