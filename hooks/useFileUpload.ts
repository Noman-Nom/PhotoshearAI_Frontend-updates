/**
 * useFileUpload Hook
 * 
 * Reusable hook for handling file uploads with drag-and-drop support.
 * Provides preview, validation, and cleanup functionality.
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';

export interface UseFileUploadOptions {
    /** Accepted file types (e.g., ['image/*', 'video/*']) */
    accept?: string[];
    /** Maximum file size in bytes (default: 10MB) */
    maxSize?: number;
    /** Callback when a valid file is selected */
    onSelect?: (file: File) => void;
    /** Callback on validation error */
    onError?: (error: string) => void;
    /** Initial preview URL (for edit mode) */
    initialPreview?: string | null;
}

export interface UseFileUploadReturn {
    /** Currently selected file */
    file: File | null;
    /** Preview URL (blob URL or initial preview) */
    preview: string | null;
    /** Whether user is dragging over the drop zone */
    isDragging: boolean;
    /** File input ref to attach to hidden input */
    inputRef: React.RefObject<HTMLInputElement>;
    /** Drag event handlers */
    dragHandlers: {
        onDragOver: (e: React.DragEvent) => void;
        onDragLeave: (e: React.DragEvent) => void;
        onDrop: (e: React.DragEvent) => void;
    };
    /** Trigger file input click */
    openFilePicker: () => void;
    /** Handle file input change */
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    /** Remove selected file and preview */
    removeFile: () => void;
    /** Set preview directly (for edit mode) */
    setPreview: (url: string | null) => void;
    /** Validation error message */
    error: string | null;
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

export const useFileUpload = (options: UseFileUploadOptions = {}): UseFileUploadReturn => {
    const {
        accept = ['image/*'],
        maxSize = DEFAULT_MAX_SIZE,
        onSelect,
        onError,
        initialPreview = null,
    } = options;

    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(initialPreview);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Cleanup blob URL on unmount or when preview changes
    useEffect(() => {
        return () => {
            if (preview && preview.startsWith('blob:')) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    // Update preview when initialPreview changes
    useEffect(() => {
        if (initialPreview && !file) {
            setPreview(initialPreview);
        }
    }, [initialPreview, file]);

    const validateFile = useCallback((f: File): boolean => {
        // Check file type
        const isValidType = accept.some(type => {
            if (type.endsWith('/*')) {
                const category = type.replace('/*', '');
                return f.type.startsWith(category);
            }
            return f.type === type;
        });

        if (!isValidType) {
            const errorMsg = `Invalid file type. Accepted: ${accept.join(', ')}`;
            setError(errorMsg);
            onError?.(errorMsg);
            return false;
        }

        // Check file size
        if (f.size > maxSize) {
            const sizeMB = Math.round(maxSize / (1024 * 1024));
            const errorMsg = `File too large. Maximum size: ${sizeMB}MB`;
            setError(errorMsg);
            onError?.(errorMsg);
            return false;
        }

        setError(null);
        return true;
    }, [accept, maxSize, onError]);

    const handleFile = useCallback((f: File) => {
        if (!validateFile(f)) return;

        // Cleanup previous blob URL
        if (preview && preview.startsWith('blob:')) {
            URL.revokeObjectURL(preview);
        }

        setFile(f);
        const url = URL.createObjectURL(f);
        setPreview(url);
        onSelect?.(f);
    }, [preview, validateFile, onSelect]);

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
            handleFile(droppedFile);
        }
    }, [handleFile]);

    const openFilePicker = useCallback(() => {
        inputRef.current?.click();
    }, []);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            handleFile(selectedFile);
        }
    }, [handleFile]);

    const removeFile = useCallback(() => {
        if (preview && preview.startsWith('blob:')) {
            URL.revokeObjectURL(preview);
        }
        setFile(null);
        setPreview(null);
        setError(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    }, [preview]);

    const setPreviewExternal = useCallback((url: string | null) => {
        if (preview && preview.startsWith('blob:')) {
            URL.revokeObjectURL(preview);
        }
        setPreview(url);
        if (!url) {
            setFile(null);
        }
    }, [preview]);

    return {
        file,
        preview,
        isDragging,
        inputRef,
        dragHandlers: {
            onDragOver,
            onDragLeave,
            onDrop,
        },
        openFilePicker,
        handleInputChange,
        removeFile,
        setPreview: setPreviewExternal,
        error,
    };
};

export default useFileUpload;
