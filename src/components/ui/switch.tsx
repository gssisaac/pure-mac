type Props = {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  id?: string;
  disabled?: boolean;
};

export function Switch({ checked, onCheckedChange, id, disabled }: Props) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={`ui-switch ${checked ? "is-on" : ""}`}
      onClick={() => onCheckedChange(!checked)}
    >
      <span className="ui-switch-thumb" />
    </button>
  );
}
