import { ErrorMessage, Field, useField } from 'formik';
import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { ApText } from '../typography';

interface IProps {
  label?: string;
  type?: string;
  name: string;
  min?: number;
  autoComplete?: string;
  value?: string;
  inputClassName?: string;
  placeholder?: string;
  disabled?: boolean;
  [key: string]: any;
  ignoreFormik?: boolean;
  ref?: React.LegacyRef<HTMLInputElement> | undefined;
  containerClassName?: string | undefined;
  onChange?: (val?: string) => void;
}

interface ApTextInputHandle {
  setCursorPosition: (start: number, end: number) => void;
}

export const ApTextInput = forwardRef<ApTextInputHandle, IProps>((props, ref) => {
  const {
    label,
    type,
    name,
    min,
    autoComplete,
    onChange,
    inputClassName,
    placeholder,
    containerClassName,
    disabled,
    ignoreFormik
  } = props;
  let formikField: [any, any, any] | null = null;
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  if (name && !ignoreFormik) {
    formikField = useField(name);
  }

  // Expose a function to set cursor position externally
  useImperativeHandle(ref, () => ({
    setCursorPosition: (start: number, end: number) => {
      inputRef.current?.setSelectionRange(start, end);
    }
  }));

  return (
    <div className={containerClassName || ''}>
      {label && (
        <ApText className="cus-sm2:text-xs" size="md">
          {label}
        </ApText>
      )}

      {type == 'textarea' ? (
        <textarea
          className={` border p-3 text-[13px] outline-none w-full rounded-sm
          focus:border-gray-400 resize-none 		
        ${inputClassName}`}
          {...props}
          {...(!ignoreFormik ? formikField?.[0] : {})}
          name={name}
          rows={5}
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          autoComplete={autoComplete || 'off'}
          placeholder={placeholder}
          onChange={(val: React.ChangeEvent<HTMLTextAreaElement>) => {
            if (!ignoreFormik) {
              formikField?.[2].setValue(val.target.value);
            }
            onChange && onChange(val.target.value);
          }}
        ></textarea>
      ) : (
        <input
          type={type}
          {...props}
          {...(!ignoreFormik ? formikField?.[0] : {})}
          autoComplete={autoComplete || 'off'}
          ref={inputRef as React.RefObject<HTMLInputElement>}
          name={name}
          disabled={disabled || false}
          min={min}
          className={` border px-3 text-[13px] outline-none w-full h-[45px] rounded-sm
         focus:border-gray-400 focus:h-[45px]
          ${inputClassName}`}
          placeholder={placeholder}
          onChange={(val: React.ChangeEvent<HTMLInputElement>) => {
            if (!ignoreFormik) {
              formikField?.[2].setValue(val.target.value);
            }
            onChange && onChange(val.target.value);
          }}
        />
      )}

      {!ignoreFormik && (
        <ErrorMessage className="text-sm text-red-500" name={name} component="div" />
      )}
    </div>
  );
});
