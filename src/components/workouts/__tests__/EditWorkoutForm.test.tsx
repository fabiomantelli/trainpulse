import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditWorkoutForm from '../EditWorkoutForm'
import { createClient } from '@/lib/supabase/client'

jest.mock('@/lib/supabase/client')
jest.mock('react-hot-toast', () => ({
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}))
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

const mockWorkout = {
  id: 'workout-123',
  trainer_id: 'trainer-123',
  name: 'Test Workout',
  description: 'Test description',
  exercises: [
    { name: 'Push-ups', sets: 3, reps: 10 },
    { name: 'Squats', sets: 3, reps: 15 },
  ],
  is_template: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockSupabaseClient = {
  from: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({ error: null }),
  })),
}

describe('EditWorkoutForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabaseClient)
  })

  it('should render the form with existing workout data', () => {
    render(<EditWorkoutForm workout={mockWorkout} trainerId="trainer-123" />)

    expect(screen.getByText(/edit workout/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Workout')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test description')).toBeInTheDocument()
  })

  it('should require workout name', async () => {
    const user = userEvent.setup()
    render(<EditWorkoutForm workout={mockWorkout} trainerId="trainer-123" />)

    const nameInput = screen.getByLabelText(/workout name \*/i)
    await user.clear(nameInput)

    const submitButton = screen.getByRole('button', { name: /update workout/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/workout name is required/i)).toBeInTheDocument()
    })
  })

  it('should update workout when form is submitted', async () => {
    const user = userEvent.setup()
    render(<EditWorkoutForm workout={mockWorkout} trainerId="trainer-123" />)

    const nameInput = screen.getByLabelText(/workout name \*/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Updated Workout')

    const submitButton = screen.getByRole('button', { name: /update workout/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('workouts')
    })
  })

  it('should show error message when update fails', async () => {
    const error = { message: 'Failed to update workout' }
    mockSupabaseClient.from = jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error }),
    }))

    const user = userEvent.setup()
    render(<EditWorkoutForm workout={mockWorkout} trainerId="trainer-123" />)

    const submitButton = screen.getByRole('button', { name: /update workout/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/failed to update workout/i)).toBeInTheDocument()
    })
  })

  it('should allow adding exercises', async () => {
    const user = userEvent.setup()
    render(<EditWorkoutForm workout={mockWorkout} trainerId="trainer-123" />)

    const addButton = screen.getByRole('button', { name: /add exercise/i })
    await user.click(addButton)

    // Should have one more exercise input (initial 2 + 1 new)
    const exerciseInputs = screen.getAllByPlaceholderText(/exercise name/i)
    expect(exerciseInputs.length).toBeGreaterThan(2)
  })

  it('should display existing exercises', () => {
    render(<EditWorkoutForm workout={mockWorkout} trainerId="trainer-123" />)

    expect(screen.getByDisplayValue('Push-ups')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Squats')).toBeInTheDocument()
  })

})


