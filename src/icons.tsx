type IconProps = { className?: string };

const S = 1.75;

function Svg({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={S}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function IconHome({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3.8 10.9 12 4.2l8.2 6.7" />
      <path d="M5.8 9.6V19a1 1 0 0 0 1 1h3.4v-4.4a1.8 1.8 0 0 1 3.6 0V20h3.4a1 1 0 0 0 1-1V9.6" />
    </Svg>
  );
}

export function IconList({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M9 6.5h11M9 12h11M9 17.5h11" />
      <path d="M4 6.5h.01M4 12h.01M4 17.5h.01" strokeWidth="2.4" />
    </Svg>
  );
}

export function IconRepeat({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4.2 12a7.8 7.8 0 0 1 13.3-5.5L20 9" />
      <path d="M20 4.6V9h-4.4" />
      <path d="M19.8 12a7.8 7.8 0 0 1-13.3 5.5L4 15" />
      <path d="M4 19.4V15h4.4" />
    </Svg>
  );
}

export function IconMoon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M20 14.3A8.4 8.4 0 0 1 9.7 4 8.4 8.4 0 1 0 20 14.3Z" />
    </Svg>
  );
}

export function IconSearch({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="11" cy="11" r="6.4" />
      <path d="m19.5 19.5-3.9-3.9" />
    </Svg>
  );
}

export function IconPlus({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 5.5v13M5.5 12h13" />
    </Svg>
  );
}

export function IconX({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />
    </Svg>
  );
}

export function IconPencil({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4.5 19.5h3.2l9.1-9.1a2.3 2.3 0 0 0-3.2-3.2l-9.1 9.1v3.2Z" />
      <path d="m13.4 8 2.6 2.6" />
    </Svg>
  );
}

export function IconTrash({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4.5 6.8h15" />
      <path d="M9.3 6.8V5.4a1.4 1.4 0 0 1 1.4-1.4h2.6a1.4 1.4 0 0 1 1.4 1.4v1.4" />
      <path d="M6.6 6.8 7.4 19a1.4 1.4 0 0 0 1.4 1.3h6.4a1.4 1.4 0 0 0 1.4-1.3l.8-12.2" />
    </Svg>
  );
}

export function IconSparkles({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 4.2 13.4 9l4.8 1.4-4.8 1.4L12 16.6l-1.4-4.8L5.8 10.4 10.6 9 12 4.2Z" />
      <path d="M18.4 15.6 19 17.4l1.8.6-1.8.6-.6 1.8-.6-1.8-1.8-.6 1.8-.6.6-1.8Z" />
    </Svg>
  );
}

export function IconChevronLeft({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="m14 6.5-5.5 5.5 5.5 5.5" />
    </Svg>
  );
}

export function IconChevronRight({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="m10 6.5 5.5 5.5L10 17.5" />
    </Svg>
  );
}

export function IconChevronDown({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="m6.5 9.5 5.5 5.5 5.5-5.5" />
    </Svg>
  );
}

export function IconSliders({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M5 8h9M17.5 8H19M5 16h1.5M10 16h9" />
      <circle cx="15.8" cy="8" r="2.1" />
      <circle cx="8.2" cy="16" r="2.1" />
    </Svg>
  );
}

export function IconSplit({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M5 5.5h4.5v4.5H5zM14.5 14h4.5v4.5h-4.5z" />
      <path d="M7.2 10v4a2.3 2.3 0 0 0 2.3 2.3h5" />
    </Svg>
  );
}

export function IconCalendar({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="3.8" y="5.6" width="16.4" height="14.6" rx="2.4" />
      <path d="M3.8 10h16.4M8.4 3.8v3.4M15.6 3.8v3.4" />
    </Svg>
  );
}

export function IconTarget({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.4" />
    </Svg>
  );
}
