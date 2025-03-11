import { createContext } from 'react';

export const FileHandlerContext = createContext<{
    saveFileInfo: () => Promise<void>;
} | null>(null);