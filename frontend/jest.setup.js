// Add jest-dom's custom assertions
import '@testing-library/jest-dom';

// Mock fetch for testing API calls
import 'jest-fetch-mock';

global.fetchMock = global.fetch;