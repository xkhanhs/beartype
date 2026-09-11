export type FaIcon = FaSolidIcon | FaRegularIcon | FaBrandIcon;

export type FaVariant = "solid" | "regular" | "brand";

export type FaObject =
  | {
      variant: "solid";
      icon: FaSolidIcon;
    }
  | {
      variant: "regular";
      icon: FaRegularIcon;
    }
  | {
      variant: "brand";
      icon: FaBrandIcon;
    }
  | {
      variant?: undefined;
      icon: FaSolidIcon;
    };

// fa- prefix is necessary because of how our font awesome subset picks up icons.
// beartype only uses a handful of icons (`<Fa icon="...">` across src/ts,
// plus the few in src/html); this union is trimmed to those, unlike upstream's
// which lists every icon in the font awesome free set.

export type FaBrandIcon = "fa-github";

// beartype does not use any "regular" style icon.
export type FaRegularIcon = never;

export type FaSolidIcon =
  | "fa-check"
  | "fa-check-circle"
  | "fa-chevron-down"
  | "fa-chevron-right"
  | "fa-circle-notch"
  | "fa-cog"
  | "fa-crown"
  | "fa-exclamation-triangle"
  | "fa-info-circle"
  | "fa-level-down-alt"
  | "fa-lock"
  | "fa-long-arrow-alt-right"
  | "fa-mouse-pointer"
  | "fa-pause"
  | "fa-question"
  | "fa-redo-alt"
  | "fa-search"
  | "fa-slash"
  | "fa-sync-alt"
  | "fa-times"
  | "fa-times-circle";
