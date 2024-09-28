// Declare that window can have a dispatchAction property with multiple arguments
declare global {
    interface Window {
      dispatchAction: (...arguments_: any[]) => Promise<void>;
    }
  }
  
  export {}; // Ensure this is treated as a module
  