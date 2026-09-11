export type BalloonProps = {
  text?: string;
  position?: BalloonPosition;
  break?: boolean;
  length?: "small" | "medium" | "large" | "xlarge" | "fit";
};

type BalloonPosition = "up" | "down" | "left" | "right";

export function buildBalloonHtmlProperties(
  options: BalloonProps | undefined,
): Record<string, string> {
  if (
    options === undefined ||
    options.text === undefined ||
    options.text === ""
  ) {
    return {};
  }
  return {
    "aria-label": options.text,
    "data-balloon-pos": options.position ?? "up",
    ...(options.break ? { "data-balloon-break": "" } : {}),
    ...(options.length ? { "data-balloon-length": options.length } : {}),
  };
}
