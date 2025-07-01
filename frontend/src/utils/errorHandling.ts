import { toast } from '@/hooks/use-toast';

/**
 * Handles API errors and displays appropriate toast messages.
 * @param error The error object or message
 * @param customMessage Optional custom message to display instead of the error message
 */
export const handleApiError = (error: unknown, customMessage?: string) => {
  console.error('API Error:', error);

  let errorMessage = 'An unexpected error occurred';

  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  toast({
    title: 'Error',
    description: customMessage ?? errorMessage,
    variant: 'destructive',
  });
};

/**
 * Handles successful API operations and displays a success toast.
 * @param message Success message to display
 */
export const handleApiSuccess = (message: string) => {
  toast({
    title: 'Success',
    description: message,
  });
};
