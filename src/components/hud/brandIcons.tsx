import { useId } from "react";

interface IconProps {
  className?: string;
}

/** Ikon WhatsApp (hijau) */
export function WhatsAppIcon({ className = "h-10 w-10" }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#25D366" />
      <path
        d="M20 9.5a10.5 10.5 0 0 0-9.1 15.7L9.5 30.5l5.5-1.4A10.5 10.5 0 1 0 20 9.5Z"
        fill="none"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M16.2 15.2c-.4.5-.6 1.3.1 2.6 1 1.9 2.5 3.3 4.3 4.2 1.3.6 2 .5 2.5.1l.9-1c.2-.3.2-.6-.1-.8l-1.6-.9c-.3-.2-.6-.1-.8.1l-.5.6c-1.4-.6-2.5-1.7-3.1-3.1l.6-.5c.2-.2.3-.5.1-.8l-.9-1.6c-.2-.3-.5-.3-.8-.1l-.7.6Z"
        fill="#fff"
      />
    </svg>
  );
}

/** Ikon Instagram (gradasi) */
export function InstagramIcon({ className = "h-10 w-10" }: IconProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const gradId = `ig${uid}`;
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#FEDA75" />
          <stop offset="0.3" stopColor="#FA7E1E" />
          <stop offset="0.55" stopColor="#D62976" />
          <stop offset="0.8" stopColor="#962FBF" />
          <stop offset="1" stopColor="#4F5BD5" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill={`url(#${gradId})`} />
      <rect
        x="10"
        y="10"
        width="20"
        height="20"
        rx="6"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
      />
      <circle
        cx="20"
        cy="20"
        r="4.8"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
      />
      <circle cx="26.2" cy="13.8" r="1.4" fill="#fff" />
    </svg>
  );
}