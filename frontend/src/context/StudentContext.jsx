import { createContext, useState } from "react";

export const StudentContext = createContext();

export function StudentProvider({ children }) {
  const [studentData, setStudentData] =
    useState(null);

  return (
    <StudentContext.Provider
      value={{
        studentData,
        setStudentData,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
}