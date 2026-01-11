import { initials } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";

const BACKGROUND_COLOR = "475569";

export function generateUserAvatar(seed: string): string {
  const avatar = createAvatar(initials, {
    seed,
    size: 64,
    fontSize: 42,
    backgroundColor: [BACKGROUND_COLOR],
    textColor: ["ffffff"],
  });

  return avatar.toDataUri();
}
