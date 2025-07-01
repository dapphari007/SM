import React from "react";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}
const DeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
}: DeleteModalProps) => {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center p-2 border-b">
              <h3 className="text-l font-semibold text-gray-800">
                Delete Confirmation
              </h3>
            </div>
            <div className="flex justify-center items-center p-2">
              <h3 className="text-m text-gray-800">
                Are you sure? Do you want to delete?
              </h3>
            </div>
            <div className="flex justify-center space-x-3 p-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm()}
                className="px-4 py-2 text-white rounded-md bg-red-500 hover:bg-red-700 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeleteModal;
