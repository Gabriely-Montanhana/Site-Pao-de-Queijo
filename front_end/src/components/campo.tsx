//// Campo reutilizável do formulário: mostra o rótulo, guarda o valor digitado e exibe a mensagem de erro embaixo do input quando a validação falha.
type CampoProps = {
  id: string;
  label: string;
  value: string;
  onChange: (valor: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  inputMode?: "numeric" | "text" | "email";
  erro?: string;
};

export function Campo({
  id,
  label,
  value,
  onChange,
  type = "text",
  required,
  disabled,
  autoComplete,
  inputMode,
  erro,
}: CampoProps) {
  return (
    <div className="mb-3">
      <label className="form-label fw-semibold" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="form-control"
        type={type}
        value={value}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={Boolean(erro)}
        aria-describedby={erro ? `${id}-erro` : undefined}
        onChange={(evento) => onChange(evento.target.value)}
      />
      {erro && (
        <span id={`${id}-erro`} className="campo-erro">
          {erro}
        </span>
      )}
    </div>
  );
}