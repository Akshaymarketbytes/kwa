import React, { useEffect, useState } from "react";
import Form from "../../../components/Form";
import apiClient from "../../../api/apiClient";

const AddValve = () => {
  const initialFields = [
    {
      id: "name",
      type: "text",
      label: "Name",
      value: "",
      placeholder: "Enter valve name",
      warning: "Please enter the valve name.",
      showWarning: true,
    },
    {
      id: "size",
      type: "text",
      label: "Size",
      value: "",
      placeholder: "Enter valve size",
      warning: "Please enter the valve size.",
      showWarning: true,
    },
    {
      id: "full_open_condition",
      type: "number",
      label: "Full Open Condition",
      value: "",
      placeholder: "Enter full open condition",
      warning: "Please enter a number for full open condition.",
      showWarning: true,
      step: "0.1",
      min: "0",
      max: "1000",
    },
    {
      id: "current_condition",
      type: "number",
      label: "Current Condition",
      value: "",
      placeholder: "Enter current condition",
      warning: "Please enter a number for current condition.",
      showWarning: true,
      step: "0.1",
      min: "0",
      max: "",
    },
    {
      id: "mid_point",
      type: "number",
      label: "Mid Point",
      value: "0.5",
      placeholder: "Enter mid point",
      warning: "Please enter a number between 0 and 1 for mid point.",
      showWarning: true,
      step: "0.01",
      min: "0",
      max: "1",
    },
    {
      id: "steepness",
      type: "number",
      label: "Steepness",
      value: "12.5",
      placeholder: "Enter steepness",
      warning: "Please enter a number between 0 and 100 for steepness.",
      showWarning: true,
      step: "0.1",
      min: "0",
      max: "100",
    },
    {
      id: "remarks",
      type: "text",
      label: "Remarks",
      value: "",
      placeholder: "Enter any remarks",
      warning: "Please enter any remarks.",
      showWarning: true,
    },
    {
      id: "latitude",
      type: "number",
      label: "Latitude",
      value: "",
      placeholder: "Enter latitude",
      warning: "Please enter latitude",
      showWarning: false,
      hidden: false,
      step: "0.000001",
    },
    {
      id: "longitude",
      type: "number",
      label: "Longitude",
      value: "",
      placeholder: "Enter longitude",
      warning: "Please enter longitude",
      showWarning: false,
      hidden: false,
      step: "0.000001",
    },
    {
      id: "area",
      type: "select",
      label: "Choose your area",
      value: null,
      warning: "Please choose an area.",
      showWarning: false,
      options: [],
    },
    {
      id: "area_image",
      type: "image",
      label: "Area Image",
      value: "",
      placeholder: "Upload the image",
      warning: "Please upload the image.",
      showWarning: true,
    },
    {
      id: "previous_position",
      type: "hidden",
      value: "",
    },
  ];

  const [mainSet, setMainSet] = useState(initialFields);
  const [editMode, setEditMode] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchAreas = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get("/area/add-area/");
        const areas = response.data.map((area) => ({
          value: area.id,
          label: area.area_name,
        }));
        setMainSet((prevFields) =>
          prevFields.map((field) =>
            field.id === "area" ? { ...field, options: areas } : field
          )
        );
      } catch (error) {
        console.error("Error fetching areas:", error);
        setValidationError("Failed to fetch areas. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAreas();
  }, []);

  const validateCurrentCondition = (current, fullOpen) => {
    if (fullOpen && current && parseFloat(current) > parseFloat(fullOpen)) {
      setValidationError("Current condition must be less than or equal to full open condition.");
      return false;
    }
    setValidationError("");
    return true;
  };

  const handleFieldChange = (id, value) => {
    setMainSet((prevFields) => {
      let updatedFields = prevFields.map((field) =>
        field.id === id
          ? { ...field, value: value === "" && field.type !== "text" ? null : value }
          : field
      );

      const fullOpen = updatedFields.find((f) => f.id === "full_open_condition").value;
      updatedFields = updatedFields.map((field) =>
        field.id === "current_condition" ? { ...field, max: fullOpen || "1000" } : field
      );

      const current = updatedFields.find((f) => f.id === "current_condition").value;
      validateCurrentCondition(current, fullOpen);

      return updatedFields;
    });
  };

  return (
    <div className="pt-14">
      {isLoading && <div>Loading areas...</div>}
      {validationError && (
        <div className="text-red-500 text-sm mb-4">{validationError}</div>
      )}
      <Form
        sectionName="Valve Section"
        dataSets={[
          {
            name: "Fields",
            fields: mainSet,
            setFields: setMainSet,
            template: initialFields,
            showEntryButtons: false,
            onFieldChange: handleFieldChange,
          },
        ]}
        editMode={editMode}
        setEditMode={setEditMode}
        apiEndpoint="/valve/valves/"
        identifierField="id"
        showAddItems={false}
        contentDisplay={false}
      />
    </div>
  );
};

export default AddValve;