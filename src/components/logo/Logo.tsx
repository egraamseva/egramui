import { useTranslation } from "react-i18next";

interface LogoProps {
  size?: "small" | "medium" | "large";
  variant?: "color" | "white" | "dark";
  showText?: boolean;
}

export function Logo({
  size = "medium",
  variant = "color",
  showText = true,
}: LogoProps) {
  const { t } = useTranslation();
  const sizes = {
    small: { icon: 40, text: "text-xl", spacing: "gap-2" },
    medium: { icon: 60, text: "text-3xl", spacing: "gap-3" },
    large: { icon: 190, text: "text-5xl", spacing: "gap-4" },
  };

  const colors = {
    color: {
      saffron: "#FF9933",
      green: "#138808",
      navy: "#000080",
      blue: "#1c4587",
      text: "#2c3e50",
      gold: "#c9a227",
    },
    white: {
      saffron: "#ffffff",
      green: "#ffffff",
      navy: "#ffffff",
      blue: "#ffffff",
      text: "#ffffff",
      gold: "#ffffff",
    },
    dark: {
      saffron: "#2c3e50",
      green: "#2c3e50",
      navy: "#2c3e50",
      blue: "#2c3e50",
      text: "#2c3e50",
      gold: "#2c3e50",
    },
  };

  const currentSize = sizes[size];
  const currentColors = colors[variant];
  const iconSize = currentSize.icon;

  return (
    <div className={`flex items-center ${currentSize.spacing}`}>
      {/* Logo Icon */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* National Emblem inspired shield/badge */}
        <defs>
          <linearGradient id="tricolor-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={currentColors.saffron} />
            <stop offset="33%" stopColor={currentColors.saffron} />
            <stop offset="33%" stopColor="white" />
            <stop offset="66%" stopColor="white" />
            <stop offset="66%" stopColor={currentColors.green} />
            <stop offset="100%" stopColor={currentColors.green} />
          </linearGradient>
        </defs>

        {/* Outer emblem circle - Government seal style */}
        <circle
          cx="60"
          cy="60"
          r="56"
          fill="white"
          stroke={currentColors.navy}
          strokeWidth="3"
        />
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke={currentColors.gold}
          strokeWidth="1"
        />

        {/* Tricolor ring */}
        <circle
          cx="60"
          cy="60"
          r="48"
          fill="none"
          stroke={currentColors.saffron}
          strokeWidth="4"
        />
        <circle
          cx="60"
          cy="60"
          r="48"
          fill="none"
          stroke="white"
          strokeWidth="4"
          strokeDasharray="37.7 37.7"
          strokeDashoffset="12.57"
        />
        <circle
          cx="60"
          cy="60"
          r="48"
          fill="none"
          stroke={currentColors.green}
          strokeWidth="4"
          strokeDasharray="37.7 37.7"
          strokeDashoffset="-25.13"
        />

        {/* Central emblem background */}
        <circle cx="60" cy="60" r="40" fill={currentColors.blue} />

        {/* Lotus petals - Symbol of purity and Indian culture */}
        <g transform="translate(60, 60)">
          {/* Bottom petals */}
          <ellipse
            cx="0"
            cy="15"
            rx="8"
            ry="18"
            fill={currentColors.saffron}
            opacity="0.9"
          />
          <ellipse
            cx="-12"
            cy="12"
            rx="8"
            ry="16"
            fill={currentColors.saffron}
            opacity="0.8"
            transform="rotate(-25 -12 12)"
          />
          <ellipse
            cx="12"
            cy="12"
            rx="8"
            ry="16"
            fill={currentColors.saffron}
            opacity="0.8"
            transform="rotate(25 12 12)"
          />

          {/* Middle petals */}
          <ellipse
            cx="-18"
            cy="5"
            rx="7"
            ry="14"
            fill="white"
            opacity="0.95"
            transform="rotate(-40 -18 5)"
          />
          <ellipse
            cx="18"
            cy="5"
            rx="7"
            ry="14"
            fill="white"
            opacity="0.95"
            transform="rotate(40 18 5)"
          />
          <ellipse
            cx="-20"
            cy="-5"
            rx="6"
            ry="12"
            fill="white"
            opacity="0.9"
            transform="rotate(-60 -20 -5)"
          />
          <ellipse
            cx="20"
            cy="-5"
            rx="6"
            ry="12"
            fill="white"
            opacity="0.9"
            transform="rotate(60 20 -5)"
          />

          {/* Top petals */}
          <ellipse
            cx="0"
            cy="-15"
            rx="7"
            ry="16"
            fill={currentColors.green}
            opacity="0.9"
          />
          <ellipse
            cx="-10"
            cy="-12"
            rx="6"
            ry="13"
            fill={currentColors.green}
            opacity="0.85"
            transform="rotate(-20 -10 -12)"
          />
          <ellipse
            cx="10"
            cy="-12"
            rx="6"
            ry="13"
            fill={currentColors.green}
            opacity="0.85"
            transform="rotate(20 10 -12)"
          />
        </g>

        {/* Panchayat building icon in center */}
        <g>
          {/* Building structure */}
          <rect
            x="48"
            y="55"
            width="24"
            height="16"
            fill="white"
            opacity="0.95"
          />
          <path d="M45 55 L60 45 L75 55 Z" fill={currentColors.gold} />

          {/* Three pillars for Panchayat */}
          <rect
            x="50"
            y="58"
            width="3"
            height="10"
            fill={currentColors.navy}
            opacity="0.8"
          />
          <rect
            x="58.5"
            y="58"
            width="3"
            height="10"
            fill={currentColors.navy}
            opacity="0.8"
          />
          <rect
            x="67"
            y="58"
            width="3"
            height="10"
            fill={currentColors.navy}
            opacity="0.8"
          />

          {/* Digital connectivity element */}
          <circle cx="60" cy="52" r="2.5" fill={currentColors.green} />
          <circle
            cx="53"
            cy="54"
            r="1.5"
            fill={currentColors.green}
            opacity="0.7"
          />
          <circle
            cx="67"
            cy="54"
            r="1.5"
            fill={currentColors.green}
            opacity="0.7"
          />
          <line
            x1="60"
            y1="52"
            x2="53"
            y2="54"
            stroke={currentColors.green}
            strokeWidth="0.8"
            opacity="0.6"
          />
          <line
            x1="60"
            y1="52"
            x2="67"
            y2="54"
            stroke={currentColors.green}
            strokeWidth="0.8"
            opacity="0.6"
          />
        </g>

        {/* Government seal text curve - top */}
        <path id="topCurve" d="M 20 60 A 40 40 0 0 1 100 60" fill="none" />
        <text
          fontSize="7"
          fill={currentColors.navy}
          fontWeight="600"
          letterSpacing="2"
        >
          <textPath href="#topCurve" startOffset="50%" textAnchor="middle">
            GOVERNMENT OF INDIA
          </textPath>
        </text>

        {/* Government seal text curve - bottom */}
        <path id="bottomCurve" d="M 100 60 A 40 40 0 0 1 20 60" fill="none" />
        <text
          fontSize="7"
          fill={currentColors.navy}
          fontWeight="600"
          letterSpacing="2"
        >
          <textPath href="#bottomCurve" startOffset="50%" textAnchor="middle">
            {t("logo.governmentOfIndiaHindi")}
          </textPath>
        </text>
      </svg>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div
            className={currentSize.text}
            style={{
              fontFamily: "system-ui, -apple-system, sans-serif",
              letterSpacing: "-0.02em",
            }}
          >
            {t("logo.eGramSevaDevanagari")
              .split("")
              .map((char, index) => {
                const colors = [
                  currentColors.saffron,
                  currentColors.navy,
                  currentColors.green,
                ];
                const colorIndex = index % 3;
                return (
                  <span
                    key={index}
                    style={{ color: colors[colorIndex], fontWeight: "700" }}
                  >
                    {char}
                  </span>
                );
              })}
          </div>
          <div
            className={` uppercase tracking-wide`}
            style={{
              fontSize:
                size === "large" ? "14px" : size === "medium" ? "11px" : "8px",
              color: currentColors.text,
              fontWeight: "600",
              letterSpacing: "0.15em",
            }}
          >
            e-GRAM SEVA
          </div>
          <div
            className="mt-0.5"
            style={{
              fontSize:
                size === "large" ? "11px" : size === "medium" ? "9px" : "7px",
              color: currentColors.blue,
              fontWeight: "500",
              letterSpacing: "0.05em",
            }}
          >
            {t("logo.digitalPanchayatServiceDevanagari")}
          </div>
          {/* <div className="mt-1 pt-1 border-t" style={{ 
            fontSize: size === 'large' ? '9px' : size === 'medium' ? '7px' : '6px',
            color: currentColors.text,
            opacity: 0.6,
            fontWeight: '500',
            letterSpacing: '0.1em',
            borderColor: currentColors.navy,
            borderOpacity: 0.2
          }}>
            Ministry of Panchayati Raj
          </div> */}
        </div>
      )}
    </div>
  );
}
