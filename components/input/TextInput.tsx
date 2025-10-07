import { Input, InputNumber } from "antd";
import { useField, useFormikContext } from "formik";

type AdInputProps = {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  component?: "input" | "number";
  min?: number;
  className?: string | React.CSSProperties;
  value?: any;
  disabled?: boolean;
};

export const AdInput = ({
  label,
  component = "input",
  min,
  className,
  ...props
}: AdInputProps) => {
  const [field, meta] = useField(props);
  const { setFieldValue } = useFormikContext<any>();

  const showError = meta.touched && meta.error;

  return (
    <div className="flex flex-col">
      <label>{label}</label>

      {component === "number" ? (
        <InputNumber
          {...props}
          min={min}
          value={field.value}
          onChange={(val) => setFieldValue(field.name, val)}
          className={`!w-full ${className}`}
        />
      ) : (
        <Input {...field} {...props} className={`!w-full !p-3 ${className}`} />
      )}

      {showError && <div className="text-red-500 text-sm">{meta.error}</div>}
    </div>
  );
};
