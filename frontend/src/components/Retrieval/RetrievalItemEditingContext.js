import { createContext, useContext } from 'react';

export const RetrievalItemEditingContext = createContext(null);

export function useRetrievalItemEditing() {
  return useContext(RetrievalItemEditingContext);
}
