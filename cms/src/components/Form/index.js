import React, { useState, useEffect, useRef } from "react";
import { motion, Reorder, useDragControls } from "framer-motion";
import { PlusIcon, TrashIcon, SaveIcon, EditIcon, XIcon, GripIcon } from "../Icons";
import FieldRenderer from "../FieldRenderer";
import Modal from "../Modal";
import apiClient from "../../api/apiClient";

const IconButton = ({ IconComponent, iconName, onClick, label, className }) => {
  const Icon = IconComponent;
  return (
    <button type="button" onClick={onClick} className={`${className} focus:outline-none flex items-center`} aria-label={label}>
      <span className="mr-1 font-semibold text-xs text-gray-800">{iconName}</span>
      <Icon size={18} strokeWidth={1.5} />
    </button>
  );
};

const EntryCard = ({ item, handleEdit, handleDelete, handleDeleteField, editMode, handleCancelEdit, removeHtmlTags, currentEditId, charLimit, dataSets, handleIndividualEdit, identifierField }) => {
  const dragControls = useDragControls();
  return (
    <Reorder.Item value={item} id={item[identifierField]} dragListener={false} dragControls={dragControls} className="w-full">
      <motion.div layout className="w-full grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="bg-white rounded-lg shadow-lg h-full grid p-2">
          <div className="flex items-center justify-between">
            {item.area_image && (
              <div className="w-full flex items-center justify-between mb-2 border border-gray-200 p-2 rounded-md">
                <img src={item.area_image instanceof File ? URL.createObjectURL(item.area_image) : item.area_image} alt="Uploaded" className="w-16 h-16 object-cover rounded-md mr-2 shadow-sm" />
                <div className="flex space-x-2">
                  <IconButton IconComponent={EditIcon} iconName="Edit" onClick={() => handleIndividualEdit(item[identifierField], "area_image", item.area_image)} label="Edit Image" className="text-blue-800 hover:text-gray-800 transition-all duration-200" />
                  <IconButton IconComponent={TrashIcon} iconName="Delete" onClick={() => handleDeleteField(item[identifierField], "area_image")} label="Delete Image" className="text-red-600 hover:text-red-800 transition-all duration-200" />
                </div>
              </div>
            )}
            <div className="cursor-grab active:cursor-grabbing p-2" onPointerDown={(e) => dragControls.start(e)}>
              <GripIcon size={18} strokeWidth={1.5} className="text-gray-600" />
            </div>
          </div>
          <div className="flex-grow space-y-2">
            {Object.entries(item).map(([key, value]) => {
              if (key === "area_image" || key === "id") return null;
              if (typeof value === "string" || key === "area") {
                const fieldLabel = dataSets.flatMap((set) => set.fields).find((field) => field.id === key)?.label || key;
                const displayValue = key === "area" ? (value?.name || "No Area") : (typeof value === "string" && value.length > charLimit ? `${value.slice(0, charLimit)}...` : value);
                return (
                  <div key={key} className="text-sm text-gray-600 flex items-center justify-between border border-gray-200 p-2 rounded-md">
                    <div className="flex items-center">
                      <span className="font-semibold text-gray-800 capitalize mr-1">{fieldLabel}:</span>
                      <span>{removeHtmlTags(displayValue)}</span>
                    </div>
                    <div className="flex space-x-2">
                      <IconButton IconComponent={EditIcon} iconName="Edit" onClick={() => handleIndividualEdit(item[identifierField], key, value)} label={`Edit ${fieldLabel}`} className="text-blue-800 hover:text-gray-800 transition-all duration-200" />
                      <IconButton IconComponent={TrashIcon} iconName="Delete" onClick={() => handleDeleteField(item[identifierField], key)} label={`Delete ${fieldLabel}`} className="text-red-600 hover:text-red-800 transition-all duration-200" />
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
          <div className="flex space-x-4 mt-2 p-2">
            <IconButton IconComponent={EditIcon} iconName="Edit all" onClick={() => handleEdit(item)} label={`Edit Entry ${item[identifierField]}`} className="text-blue-800 hover:text-gray-800 transition-all duration-200" />
            {editMode && currentEditId === item[identifierField] && (
              <IconButton IconComponent={XIcon} onClick={() => handleCancelEdit(item[identifierField])} label="Cancel Edit" className="text-gray-600 hover:text-gray-800 transition-all duration-200" />
            )}
            <IconButton IconComponent={TrashIcon} iconName="Delete all" onClick={() => handleDelete(item[identifierField])} label={`Delete ${item[identifierField]}`} className="text-red-600 hover:text-red-800 transition-all duration-200" />
          </div>
        </div>
      </motion.div>
    </Reorder.Item>
  );
};

const Form = ({ dataSets, editMode, setEditMode, sectionName, apiEndpoint, identifierField = "id", showAddItems = false, contentDisplay = true, updatedContentTitle }) => {
  const [data, setData] = useState([]);
  const [areas, setAreas] = useState([]);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [individualEdit, setIndividualEdit] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [newEntries, setNewEntries] = useState([]);
  const [validationError, setValidationError] = useState("");
  const rowsPerPage = 4;
  const charLimit = 50;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.get(apiEndpoint);
        setData(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    const fetchAreas = async () => {
      try {
        const response = await apiClient.get("/area/add-area/");
        setAreas(response.data);
      } catch (error) {
        console.error("Error fetching areas:", error);
      }
    };

    fetchData();
    fetchAreas();
  }, [apiEndpoint]);

  const handleReorder = (newOrder) => {
    setData(newOrder);
    const orderData = newOrder.map((item, index) => ({ id: item[identifierField], order: index }));
    apiClient.post(`${apiEndpoint}reorder/`, { order: orderData })
      .then(() => {
        setModalTitle("Success");
        setModalMessage("Order updated successfully.");
        setIsModalOpen(true);
      })
      .catch((error) => {
        console.error("Error updating order:", error);
        setModalTitle("Error");
        setModalMessage("Failed to update order.");
        setIsModalOpen(true);
      });
  };

  const handleAddNewEntry = () => {
    const newEntry = dataSets[0].template.map((field) => ({ ...field, value: field.type === "image" ? null : field.id === "area" ? null : "" }));
    setNewEntries((prev) => [...prev, newEntry]);
  };

  const handleNewEntryChange = (entryIndex, fieldId, value) => {
    setNewEntries((prev) => prev.map((entry, idx) => {
      if (idx !== entryIndex) return entry;
      const updatedEntry = entry.map((field) => field.id === fieldId ? { ...field, value } : field);
      const fullOpen = updatedEntry.find((f) => f.id === "full_open_condition")?.value;
      const current = updatedEntry.find((f) => f.id === "current_condition")?.value;
      if (fullOpen && current && parseFloat(current) > parseFloat(fullOpen)) {
        setValidationError("Current condition must be less than or equal to full open condition.");
      } else {
        setValidationError("");
      }
      return updatedEntry;
    }));
  };

  const handleRemoveNewEntry = (entryIndex) => {
    setNewEntries((prev) => prev.filter((_, idx) => idx !== entryIndex));
    setValidationError("");
  };

  const handleIndividualEdit = (itemIdentifier, fieldId, currentValue) => {
    const item = data.find((i) => i[identifierField] === itemIdentifier);
    const field = dataSets.flatMap((set) => set.fields).find((f) => f.id === fieldId);
    const max = fieldId === "current_condition" ? item.full_open_condition : field.max;
    setIndividualEdit({ itemIdentifier, field: { ...field, value: fieldId === "area" ? (currentValue?.id || null) : currentValue, max } });
    setEditMode(true);
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleIndividualFieldChange = (id, value) => {
    setIndividualEdit((prev) => {
      const updatedField = { ...prev.field, value };
      const item = data.find((i) => i[identifierField] === prev.itemIdentifier);
      if (id === "current_condition") {
        const fullOpen = item.full_open_condition;
        if (value && parseFloat(value) > parseFloat(fullOpen)) {
          setValidationError("Current condition must be less than or equal to full open condition.");
        } else {
          setValidationError("");
        }
      }
      return { ...prev, field: updatedField };
    });
  };

  const handleIndividualSubmit = async (event) => {
    event.preventDefault();
    if (!individualEdit || validationError) return;
    const formData = new FormData();
    const value = individualEdit.field.type === "number" ? (individualEdit.field.value || "0") :
                  individualEdit.field.id === "area" ? (individualEdit.field.value || null) :
                  (individualEdit.field.value || "");
    formData.append(individualEdit.field.id === "area" ? "area_id" : individualEdit.field.id, value);
    try {
      const response = await apiClient.patch(`${apiEndpoint}${individualEdit.itemIdentifier}/`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      setData((prevData) => prevData.map((item) => item[identifierField] === individualEdit.itemIdentifier ? response.data : item));
      setIndividualEdit(null);
      setEditMode(false);
      setModalTitle("Success");
      setModalMessage("Field updated successfully.");
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error updating field:", error);
      setModalTitle("Error");
      setModalMessage(error.response?.data?.area_id?.[0] || "Failed to update field.");
      setIsModalOpen(true);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitted(true);
    if (validationError) return;

    if (newEntries.length > 0) {
      try {
        const responses = await Promise.all(newEntries.map(async (entry) => {
          const formData = new FormData();
          entry.forEach((field) => {
            if (!field.hidden) {
              const value = field.type === "number" ? (field.value || "0") :
                            field.id === "area" ? (field.value || null) :
                            (field.value || "");
              formData.append(field.id === "area" ? "area_id" : field.id, value);
            }
          });
          return apiClient.post(apiEndpoint, formData, { headers: { "Content-Type": "multipart/form-data" } });
        }));
        setData((prevData) => [...prevData, ...responses.map((res) => res.data)]);
        setNewEntries([]);
        setModalTitle("Success");
        setModalMessage("Multiple entries added successfully.");
        setIsModalOpen(true);
      } catch (error) {
        console.error("Error adding entries:", error);
        setModalTitle("Error");
        setModalMessage(error.response?.data?.area_id?.[0] || "Failed to add entries.");
        setIsModalOpen(true);
      }
    } else if (currentEditId !== null) {
      const formData = new FormData();
      dataSets.forEach(({ fields }) => {
        fields.forEach((field) => {
          if (!field.hidden) {
            const value = field.type === "number" ? (field.value || "0") :
                          field.id === "area" ? (field.value || null) :
                          (field.value || "");
            formData.append(field.id === "area" ? "area_id" : field.id, value);
          }
        });
      });
      try {
        const response = await apiClient.put(`${apiEndpoint}${currentEditId}/`, formData, { headers: { "Content-Type": "multipart/form-data" } });
        setData((prevData) => prevData.map((item) => item[identifierField] === currentEditId ? response.data : item));
        setCurrentEditId(null);
        setEditMode(false);
        setModalTitle("Success");
        setModalMessage("Entry updated successfully.");
        setIsModalOpen(true);
      } catch (error) {
        console.error("Error updating entry:", error);
        setModalTitle("Error");
        setModalMessage(error.response?.data?.area_id?.[0] || "Failed to update entry.");
        setIsModalOpen(true);
      }
    } else {
      const formData = new FormData();
      dataSets.forEach(({ fields }) => {
        fields.forEach((field) => {
          if (!field.hidden) {
            const value = field.type === "number" ? (field.value || "0") :
                          field.id === "area" ? (field.value || null) :
                          (field.value || "");
            formData.append(field.id === "area" ? "area_id" : field.id, value);
          }
        });
      });
      try {
        const response = await apiClient.post(apiEndpoint, formData, { headers: { "Content-Type": "multipart/form-data" } });
        setData((prevData) => [...prevData, response.data]);
        dataSets.forEach(({ setFields }) => {
          setFields((fields) => fields.map((field) => ({ ...field, value: field.type === "image" ? null : field.id === "area" ? null : "" })));
        });
        setModalTitle("Success");
        setModalMessage("Entry added successfully.");
        setIsModalOpen(true);
      } catch (error) {
        console.error("Error adding entry:", error);
        setModalTitle("Error");
        setModalMessage(error.response?.data?.area_id?.[0] || "Failed to add entry.");
        setIsModalOpen(true);
      }
    }
    setIsSubmitted(false);
  };

  const handleDelete = async (identifier) => {
    try {
      await apiClient.delete(`${apiEndpoint}${identifier}/`);
      setData((prevData) => prevData.filter((item) => item[identifierField] !== identifier));
      setModalTitle("Success");
      setModalMessage("Entry deleted successfully.");
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error deleting entry:", error);
      setModalTitle("Error");
      setModalMessage("Failed to delete entry.");
      setIsModalOpen(true);
    }
  };

  const handleDeleteField = async (identifier, fieldId) => {
    const formData = new FormData();
    formData.append(fieldId, "");
    try {
      const response = await apiClient.patch(`${apiEndpoint}${identifier}/`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      setData((prevData) => prevData.map((item) => item[identifierField] === identifier ? response.data : item));
      setModalTitle("Success");
      setModalMessage(`Field ${fieldId} deleted successfully.`);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error deleting field:", error);
      setModalTitle("Error");
      setModalMessage("Failed to delete field.");
      setIsModalOpen(true);
    }
  };

  const handleEdit = (item) => {
    dataSets.forEach(({ fields, setFields }) => {
      setFields(fields.map((field) => ({
        ...field,
        value: field.id === "area" ? (item[field.id]?.id || null) : item[field.id] || (field.type === "image" ? null : ""),
        max: field.id === "current_condition" ? item.full_open_condition : field.max
      })));
    });
    setCurrentEditId(item[identifierField]);
    setEditMode(true);
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    dataSets.forEach(({ fields, setFields }) => {
      setFields(fields.map((field) => ({ ...field, value: field.type === "image" ? null : field.id === "area" ? null : "" })));
    });
    setCurrentEditId(null);
    setIndividualEdit(null);
    setEditMode(false);
    setIsSubmitted(false);
    setNewEntries([]);
    setValidationError("");
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const removeHtmlTags = (str) => {
    if (typeof str !== "string") return "";
    return str.replace(/<\/?[^>]*>/g, "");
  };

  const handlePagination = (direction) => {
    setCurrentPage((prevPage) => direction === "next" ? prevPage + 1 : prevPage > 1 ? prevPage - 1 : prevPage);
  };

  const paginatedData = data.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const formRef = useRef(null);

  return (
    <>
      <div className="min-h-screen flex items-start justify-center p-4 bg-transparent">
        <div className="w-full space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">{sectionName}</h2>
          {validationError && (
            <div className="text-red-500 text-sm mb-4">{validationError}</div>
          )}
          {individualEdit ? (
            <form onSubmit={handleIndividualSubmit} ref={formRef} className="space-y-6">
              <div className="mb-4">
                <FieldRenderer
                  field={individualEdit.field}
                  setFields={(fields) => fields.map((f) => f.id === individualEdit.field.id ? { ...f, value: individualEdit.field.value } : f)}
                  onChange={handleIndividualFieldChange}
                  isSubmitted={isSubmitted}
                  options={individualEdit.field.id === "area" ? areas.map((area) => ({ value: area.id, label: area.area_name })) : undefined}
                />
              </div>
              <div className="flex space-x-4 justify-start">
                <motion.button whileTap={{ scale: 0.95 }} type="submit" className="min-w-xs px-6 py-2 bg-blue-200 text-blue-800 hover:text-gray-800 hover:bg-gray-200 text-sm font-medium rounded-lg transition-all duration-300 flex items-center justify-center" disabled={!!validationError}>
                  <SaveIcon size={18} strokeWidth={1.5} />
                  <span className="ml-1">Update Field</span>
                </motion.button>
                <IconButton IconComponent={XIcon} onClick={handleCancelEdit} label="Cancel" className="text-gray-600 hover:text-gray-800 transition-all duration-200" />
              </div>
            </form>
          ) : (
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
              {!editMode && newEntries.length === 0 && (
                <div className="space-y-4">
                  {dataSets.map(({ name, fields, onFieldChange }, index) => (
                    <div key={index} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {fields.map((field) => (
                          !field.hidden && (
                            <FieldRenderer
                              key={field.id}
                              field={field}
                              setFields={dataSets[index].setFields}
                              onChange={onFieldChange}
                              isSubmitted={isSubmitted}
                              options={field.id === "area" ? areas.map((area) => ({ value: area.id, label: area.area_name })) : undefined}
                            />
                          )
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {newEntries.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-gray-800 mb-2">New Entries:</h3>
                  {newEntries.map((entry, entryIndex) => (
                    <div key={entryIndex} className="space-y-2 rounded-md">
                      <div className="grid grid-cols-2 gap-4">
                        {entry.map((field) => (
                          !field.hidden && (
                            <FieldRenderer
                              key={field.id}
                              field={field}
                              setFields={(fields) => handleNewEntryChange(entryIndex, field.id, fields.find((f) => f.id === field.id).value)}
                              onChange={(id, value) => handleNewEntryChange(entryIndex, id, value)}
                              isSubmitted={isSubmitted}
                              options={field.id === "area" ? areas.map((area) => ({ value: area.id, label: area.area_name })) : undefined}
                            />
                          )
                        ))}
                      </div>
                      <div className="flex items-center justify-start space-x-2">
                        {showAddItems && (
                          <div className="flex items-center justify-center cursor-pointer" onClick={() => handleRemoveNewEntry(entryIndex)}>
                            <IconButton IconComponent={TrashIcon} label="Remove Entry" className="text-red-600 hover:text-red-800 transition-all duration-200" />
                            <span className="ml-1 text-sm text-red-600 hover:text-red-800 transition-all duration-200">Remove</span>
                          </div>
                        )}
                        {(editMode || newEntries.length > 0) && (
                          <div className="flex items-center justify-center cursor-pointer" onClick={handleCancelEdit}>
                            <IconButton IconComponent={XIcon} label="Cancel" className="text-gray-600 hover:text-gray-800 transition-all duration-200" />
                            <span className="ml-1 text-sm text-gray-600 hover:text-gray-800 transition-all duration-200">Remove all</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {editMode && currentEditId !== null && (
                <div className="space-y-4">
                  {dataSets.map(({ name, fields }, index) => (
                    <div key={index} className="space-y-4">
                      <h3 className="text-xs font-semibold text-gray-800 mb-2">{name}:</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {fields.map((field) => (
                          !field.hidden && (
                            <FieldRenderer
                              key={field.id}
                              field={field}
                              setFields={dataSets[index].setFields}
                              isSubmitted={isSubmitted}
                              options={field.id === "area" ? areas.map((area) => ({ value: area.id, label: area.area_name })) : undefined}
                            />
                          )
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-start space-x-4">
                {showAddItems && (
                  <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={handleAddNewEntry} className="min-w-xs px-6 py-2 bg-blue-200 text-blue-800 hover:text-gray-800 hover:bg-gray-200 text-sm font-medium rounded-lg transition-all duration-300 flex items-center justify-center" aria-label="Add Entry">
                    <PlusIcon size={18} strokeWidth={1.5} />
                    <span className="ml-1">Add Item</span>
                  </motion.button>
                )}
                <motion.button whileTap={{ scale: 0.95 }} type="submit" className="min-w-xs px-2 py-2 bg-blue-200 text-blue-800 hover:text-gray-800 hover:bg-gray-200 text-sm font-medium rounded-lg transition-all duration-300 flex items-center justify-center" aria-label="Save Form" disabled={!!validationError}>
                  <SaveIcon size={18} strokeWidth={1.5} />
                  <span className="ml-1">{editMode && currentEditId !== null ? "Update" : "Save"}</span>
                </motion.button>
              </div>
            </form>
          )}
          {contentDisplay && (
            <div className="space-y-4">
              <h2 className="text-xs font-semibold text-gray-800 mb-2">{updatedContentTitle}</h2>
              <Reorder.Group axis="y" values={data} onReorder={handleReorder} className="flex flex-col items-start gap-4">
                {paginatedData.map((item) => (
                  <EntryCard
                    key={item[identifierField]}
                    item={item}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                    handleDeleteField={handleDeleteField}
                    editMode={editMode}
                    currentEditId={currentEditId}
                    handleCancelEdit={handleCancelEdit}
                    removeHtmlTags={removeHtmlTags}
                    charLimit={charLimit}
                    dataSets={dataSets}
                    handleIndividualEdit={handleIndividualEdit}
                    identifierField={identifierField}
                  />
                ))}
              </Reorder.Group>
              <div className="flex justify-center space-x-4 w-full">
                <button onClick={() => handlePagination("prev")} disabled={currentPage === 1} className="px-6 py-2 bg-blue-200 text-blue-800 hover:text-gray-800 hover:bg-gray-200 text-sm font-medium rounded-lg transition-all duration-300 disabled:bg-gray-200 disabled:text-gray-400">Previous</button>
                <button onClick={() => handlePagination("next")} disabled={currentPage * rowsPerPage >= data.length} className="px-6 py-2 bg-blue-200 text-blue-800 hover:text-gray-800 hover:bg-gray-200 text-sm font-medium rounded-lg transition-all duration-300 disabled:bg-gray-200 disabled:text-gray-400">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} message={modalMessage} title={modalTitle} />
    </>
  );
};

export default Form;