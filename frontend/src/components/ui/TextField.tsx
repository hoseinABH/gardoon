"use client";

import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn, toEnDigits } from "@/lib/format/digits";
import { AlertCircle, XCircle } from "./Icons";
import { Typography } from "./Typography";

function OutlinedFrame({
  label,
  floating,
  focused,
  hasError,
  quiet,
  radiusClass = "rounded-2xl",
}: {
  label: string;
  floating: boolean;
  focused: boolean;
  hasError: boolean;
  quiet?: boolean;
  radiusClass?: string;
}) {
  return (
    <fieldset
      aria-hidden
      className={cn(
        "pointer-events-none absolute -top-1.5 inset-x-0 bottom-0 m-0 min-w-0 px-3 transition-colors",
        radiusClass,
        hasError
          ? "border-2 border-destructive"
          : focused
          ? "border-2 border-primary"
          : quiet
          ? "border border-white/12"
          : "border border-border group-hover:border-white/35"
      )}
    >
      <legend
        className={cn(
          "block h-3 overflow-hidden whitespace-nowrap p-0 text-2xs font-semibold leading-none transition-all duration-150",
          floating ? "max-w-full px-1.5" : "max-w-0"
        )}
      >
        <span className="invisible">{label}</span>
      </legend>
    </fieldset>
  );
}

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "placeholder"> {
  label: string;
  hint?: string;
  error?: string;
  ltr?: boolean;
  numericNormalize?: boolean;
  leading?: ReactNode;
  suffix?: ReactNode;
  trailing?: ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  quiet?: boolean;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    {
      label,
      hint,
      error,
      ltr,
      numericNormalize,
      leading,
      suffix,
      trailing,
      clearable = true,
      onClear,
      quiet = false,
      id,
      className,
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      readOnly,
      ...props
    },
    ref
  ) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;
    const [focused, setFocused] = useState(false);

    const resolvedVal = value ?? defaultValue;
    const hasValue = resolvedVal !== undefined && String(resolvedVal).length > 0;
    const floating = focused || hasValue;
    const hasError = Boolean(error);

    const handleChange: InputHTMLAttributes<HTMLInputElement>["onChange"] = (e) => {
      if (numericNormalize) {
        e.target.value = toEnDigits(e.target.value);
      }
      onChange?.(e);
    };

    return (
      <div className={cn("space-y-1.5 pt-1", className)}>
        <div className="group relative flex min-h-14 items-center gap-2 rounded-2xl bg-white/2 px-4 transition-colors">
          <OutlinedFrame
            label={label}
            floating={floating}
            focused={focused}
            hasError={hasError}
            quiet={quiet}
          />

          {leading && (
            <span
              className={cn(
                "relative z-10 shrink-0 transition-colors",
                hasError
                  ? "text-destructive"
                  : focused
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {leading}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            value={value}
            defaultValue={defaultValue}
            readOnly={readOnly}
            onChange={handleChange}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            dir={ltr ? "ltr" : "rtl"}
            placeholder=" "
            aria-invalid={hasError ? true : undefined}
            aria-describedby={hasError ? errorId : hint ? hintId : undefined}
            className={cn(
              "relative z-10 h-14 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none tabular-nums placeholder:text-transparent",
              ltr && "text-start tracking-wider",
              quiet && "text-muted-foreground"
            )}
            {...props}
          />

          <label
            htmlFor={inputId}
            className={cn(
              "pointer-events-none absolute z-10 transition-all duration-150",
              floating
                ? "-top-2 start-4 text-2xs font-semibold"
                : Boolean(leading)
                ? "top-1/2 -translate-y-1/2 start-11 text-sm font-normal"
                : "top-1/2 -translate-y-1/2 start-4 text-sm font-normal",
              hasError
                ? "text-destructive"
                : focused
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            {label}
          </label>

          {clearable && hasValue && !readOnly && onClear && (
            <button
              type="button"
              onClick={onClear}
              aria-label={`پاک کردن ${label}`}
              className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-white/8 hover:text-foreground transition cursor-pointer"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}

          {hasError && (
            <AlertCircle
              aria-hidden
              className="relative z-10 h-4 w-4 shrink-0 text-destructive"
            />
          )}

          {suffix && (
            <Typography variant="label-sm" tone="muted" className="relative z-10 shrink-0">
              {suffix}
            </Typography>
          )}

          {trailing && <span className="relative z-10 shrink-0">{trailing}</span>}
        </div>

        {hasError ? (
          <Typography
            id={errorId}
            as="p"
            role="alert"
            variant="label-sm"
            tone="danger"
            className="flex items-center gap-1 px-3"
          >
            {error}
          </Typography>
        ) : (
          hint && (
            <Typography
              id={hintId}
              as="p"
              variant="label-sm"
              tone="muted"
              className="block px-3"
            >
              {hint}
            </Typography>
          )
        )}
      </div>
    );
  }
);

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Array<{ value: string | number; label: string }>;
}

export function SelectField({
  label,
  options,
  id,
  className,
  onFocus,
  onBlur,
  ...props
}: SelectFieldProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const [focused, setFocused] = useState(false);

  return (
    <div className={cn("pt-1", className)}>
      <div className="group relative flex h-14 items-center rounded-2xl bg-white/2 px-4">
        <OutlinedFrame
          label={label}
          floating
          focused={focused}
          hasError={false}
        />
        <select
          id={selectId}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          className="relative z-10 h-full w-full bg-transparent text-sm font-semibold text-foreground outline-none cursor-pointer"
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-card text-foreground">
              {opt.label}
            </option>
          ))}
        </select>
        <label
          htmlFor={selectId}
          className={cn(
            "pointer-events-none absolute -top-2 start-4 z-10 text-2xs font-semibold transition-colors",
            focused ? "text-primary" : "text-muted-foreground"
          )}
        >
          {label}
        </label>
      </div>
    </div>
  );
}

export interface TextAreaFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "placeholder"> {
  label: string;
}

export function TextAreaField({
  label,
  id,
  className,
  value,
  defaultValue,
  onFocus,
  onBlur,
  ...props
}: TextAreaFieldProps) {
  const generatedId = useId();
  const areaId = id ?? generatedId;
  const [focused, setFocused] = useState(false);
  const resolvedVal = value ?? defaultValue;
  const hasValue = resolvedVal !== undefined && String(resolvedVal).length > 0;
  const floating = focused || hasValue;

  return (
    <div className={cn("pt-1", className)}>
      <div className="group relative flex min-h-24 rounded-2xl bg-white/2 px-4 py-3">
        <OutlinedFrame
          label={label}
          floating={floating}
          focused={focused}
          hasError={false}
        />
        <textarea
          id={areaId}
          value={value}
          defaultValue={defaultValue}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          placeholder=" "
          rows={3}
          className="relative z-10 min-w-0 flex-1 resize-none bg-transparent text-sm text-foreground outline-none"
          {...props}
        />
        <label
          htmlFor={areaId}
          className={cn(
            "pointer-events-none absolute z-10 transition-all duration-150",
            floating
              ? "-top-2 start-4 text-2xs font-semibold"
              : "top-4 start-4 text-sm font-normal",
            focused ? "text-primary" : "text-muted-foreground"
          )}
        >
          {label}
        </label>
      </div>
    </div>
  );
}
