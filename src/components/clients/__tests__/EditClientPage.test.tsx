import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditClientPage from '../EditClientPage'
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
jest.mock('@/components/layout/BackButton', () => {
  return function BackButton() {
    return <button>Back</button>
  }
})

const mockClient = {
  id: 'client-123',
  trainer_id: 'trainer-123',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '123-456-7890',
  state: 'CA',
  city: 'San Francisco',
  zip_code: '94102',
  date_of_birth: '1990-01-01T00:00:00Z',
  notes: 'Initial notes',
  goals: 'Lose weight',
  medical_notes: 'No allergies',
  photo_url: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockSupabaseClient = {
  from: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({ error: null }),
  })),
  storage: {
    from: jest.fn(() => ({
      remove: jest.fn().mockResolvedValue({ error: null }),
      upload: jest.fn().mockResolvedValue({ error: null, data: { path: 'test-path' } }),
      getPublicUrl: jest.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/photo.jpg' },
      }),
    })),
  },
}

describe('EditClientPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabaseClient)
  })

  it('should render the form with existing client data', () => {
    render(<EditClientPage client={mockClient} trainerId="trainer-123" />)

    expect(screen.getByText(/edit client/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('123-456-7890')).toBeInTheDocument()
  })

  it('should update client when form is submitted', async () => {
    const user = userEvent.setup()
    render(<EditClientPage client={mockClient} trainerId="trainer-123" />)

    const nameInput = screen.getByLabelText(/name \*/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Jane Doe')

    const submitButton = screen.getByRole('button', { name: /update client/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('clients')
    })
  })

  it('should show error message when update fails', async () => {
    const error = { message: 'Failed to update client' }
    mockSupabaseClient.from = jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error }),
    }))

    const user = userEvent.setup()
    render(<EditClientPage client={mockClient} trainerId="trainer-123" />)

    const submitButton = screen.getByRole('button', { name: /update client/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/failed to update client/i)).toBeInTheDocument()
    })
  })

})


