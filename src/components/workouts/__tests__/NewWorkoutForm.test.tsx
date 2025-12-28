import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewWorkoutForm from '../NewWorkoutForm'
import { createClient } from '@/lib/supabase/client'

jest.mock('@/lib/supabase/client')
jest.mock('react-hot-toast', () => ({
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Use global mock from jest.setup.js - no local mock needed

jest.mock('../ExerciseLibrary', () => {
  return function ExerciseLibrary() {
    return <div data-testid="exercise-library">Exercise Library</div>
  }
})

jest.mock('@/components/layout/BackButton', () => {
  return function BackButton() {
    return <button>Back</button>
  }
})

const mockSupabaseClient = {
  from: jest.fn(() => ({
    insert: jest.fn().mockResolvedValue({ error: null }),
  })),
}

describe('NewWorkoutForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabaseClient)
  })

  it('should require workout name and show validation error', async () => {
    const user = userEvent.setup()
    render(<NewWorkoutForm trainerId="test-trainer-id" />)
    
    // Verify form renders
    expect(screen.getByText(/create new workout/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/workout name/i)).toBeInTheDocument()
    
    // Test validation
    const submitButton = screen.getByRole('button', { name: /create workout/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/workout name is required/i)).toBeInTheDocument()
    })
  })

  it('should allow adding exercises', async () => {
    const user = userEvent.setup()
    render(<NewWorkoutForm trainerId="test-trainer-id" />)
    
    const addButton = screen.getByRole('button', { name: /add exercise/i })
    await user.click(addButton)
    
    expect(screen.getByPlaceholderText(/exercise name/i)).toBeInTheDocument()
  })
})


