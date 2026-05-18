import { formatBytes } from "../../lib/utils";

export function SizeLabel({ bytes }: { bytes: number }) {
  return <span className="mono muted">{formatBytes(bytes)}</span>;
}
