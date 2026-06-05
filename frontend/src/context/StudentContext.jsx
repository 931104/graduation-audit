import { createContext, useState } from "react";

export const StudentContext = createContext();

export function StudentProvider({ children }) {
  const [studentId, setStudentId] = useState(null);

  return (
    <StudentContext.Provider value={{ studentId, setStudentId }}>
      {children}
    </StudentContext.Provider>
  );
}
