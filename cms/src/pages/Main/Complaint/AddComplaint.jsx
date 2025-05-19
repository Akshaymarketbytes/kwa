import React, { useState, useEffect } from "react";
import Form from "../../../components/Form";
import apiClient from "../../../api/apiClient";

const AddComplaint = () => {
  const initialFields = [
    {
      id: "area",
      type: "select",
      label: "Choose your area",
      value: "",
      warning: "Please choose an area.",
      showWarning: true,
      options: [],
    },
    {
      id: "complaint_type",
      type: "select",
      label: "Complaint Type",
      value: "",
      warning: "Please choose a complaint type.",
      showWarning: true,
      options: [
        { value: "general", label: "General" },
        { value: "consumer", label: "Consumer" },
      ],
    },
    {
      id: "name",
      type: "text",
      label: "Name",
      value: "",
      warning: "Please enter your name.",
      showWarning: true,
    },
    {
      id: "address",
      type: "text",
      label: "Address",
      value: "",
      warning: "Please enter your address.",
      showWarning: true,
    },
    {
      id: "phone_number",
      type: "text",
      label: "Phone Number",
      value: "",
      warning: "Please enter your phone number.",
      showWarning: true,
    },
    {
      id: "department",
      type: "select",
      label: "Department",
      value: "",
      warning: "Please choose a department.",
      showWarning: true,
      options: [
        { value: "bluebrigade", label: "Blue Brigade" },
        { value: "runningcontract", label: "Runningcontract" },
      ],
    },
  ];

  const [mainSet, setMainSet] = useState(initialFields);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    apiClient
      .get("/area/add-area/")
      .then((response) => {
        const areas = response.data.map((area) => ({
          value: area.id,
          label: area.area_name,
        }));
        setMainSet((prevFields) =>
          prevFields.map((field) =>
            field.id === "area" ? { ...field, options: areas } : field
          )
        );
      })
      .catch((error) => {
        console.error("Error fetching areas:", error);
      });
  }, []);

  return (
    <div className="pt-14 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-800">Complaint Section</h2>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <Form
          sectionName="Complaint Section"
          dataSets={[
            {
              name: "Fields",
              fields: mainSet.map((field) => ({
                ...field,
                className: "w-full p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white shadow-sm",
                labelClassName: "block text-sm font-medium text-gray-700 mb-1",
                wrapperClassName: "mb-4",
              })),
              setFields: setMainSet,
              template: initialFields,
              showEntryButtons: false,
            },
          ]}
          editMode={editMode}
          setEditMode={setEditMode}
          apiEndpoint="/complaint/complaints/"
          identifierField="id"
          showAddItems={false}
          contentDisplay={false}
        />
      </div>
    </div>
  );
};

export default AddComplaint;