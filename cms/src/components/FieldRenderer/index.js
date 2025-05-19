import React from "react";

const FieldRenderer = ({ field, setFields, onChange, isSubmitted }) => {
  const handleChange = (e) => {
    const value = e.target.value;
    if (field.type === "number") {
      // Allow empty input or valid numbers
      if (value === "" || !isNaN(value)) {
        setFields((prev) =>
          prev.map((f) =>
            f.id === field.id ? { ...f, value, showWarning: isSubmitted && !value && f.showWarning } : f
          )
        );
        if (onChange) {
          onChange(field.id, value);
        }
      }
    } else if (field.type === "image") {
      const file = e.target.files[0];
      setFields((prev) =>
        prev.map((f) =>
          f.id === field.id ? { ...f, value: file, showWarning: isSubmitted && !file && f.showWarning } : f
        )
      );
      if (onChange) {
        onChange(field.id, file);
      }
    } else {
      setFields((prev) =>
        prev.map((f) =>
          f.id === field.id ? { ...f, value, showWarning: isSubmitted && !value && f.showWarning } : f
        )
      );
      if (onChange) {
        onChange(field.id, value);
      }
    }
  };

  return (
    <div className="mb-4">
      <label htmlFor={field.id} className="block text-sm font-medium text-gray-700">
        {field.label}
      </label>
      {field.type === "select" ? (
        <select
          id={field.id}
          value={field.value}
          onChange={handleChange}
          className="mt-1 block w-full border rounded px-2 py-1"
        >
          <option value="">Select {field.label}</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : field.type === "image" ? (
        <input
          type="file"
          id={field.id}
          accept="image/*"
          onChange={handleChange}
          className="mt-1 block w-full border rounded px-2 py-1"
        />
      ) : (
        <input
          type={field.type}
          id={field.id}
          value={field.type !== "image" ? field.value : undefined}
          onChange={handleChange}
          placeholder={field.placeholder}
          step={field.step}
          min={field.min}
          max={field.max}
          className="mt-1 block w-full border rounded px-2 py-1"
        />
      )}
      {field.showWarning && isSubmitted && !field.value && (
        <p className="text-red-500 text-sm mt-1">{field.warning}</p>
      )}
    </div>
  );
};

export default FieldRenderer;