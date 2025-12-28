import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AppointmentForm from '../AppointmentForm'
import { createClient } from '@/lib/supabase/client'

jest.mock('@/lib/supabase/client')
jest.mock('react-hot-toast', () => ({
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Use global mock from jest.setup.js - no local mock needed

jest.mock('../TimeSlotPicker', () => {
  return function TimeSlotPicker() {
    return <div data-testid="time-slot-picker">Time Slot Picker</div>
  }
})

jest.mock('@/components/layout/BackButton', () => {
  return function BackButton() {
    return <button>Back</button>
  }
})

const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue({ error: null }),
    update: jest.fn().mockResolvedValue({ error: null }),
  })),
}

const mockClients = [
  { id: '1', name: 'John Doe', email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
]

describe('AppointmentForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabaseClient)
  })

  it('should render the form', () => {
    render(
      <AppointmentForm
        trainerId="test-trainer-id"
        clients={mockClients}
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    expect(screen.getByText(/client/i)).toBeInTheDocument()
    expect(screen.getByTestId('time-slot-picker')).toBeInTheDocument()
  })

  it('should require client selection', () => {
    render(
      <AppointmentForm
        trainerId="test-trainer-id"
        clients={mockClients}
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    const submitButton = screen.getByRole('button', { name: /create appointment/i })
    expect(submitButton).toBeDisabled()
  })
})


