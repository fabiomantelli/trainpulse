import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewClientForm from '../NewClientForm'
import { createClient } from '@/lib/supabase/client'

jest.mock('@/lib/supabase/client')
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}))

const mockSupabaseClient = {
  from: jest.fn(() => ({
    insert: jest.fn(() => Promise.resolve({ error: null })),
  })),
}

describe('NewClientForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabaseClient)
  })

  it('should render the form', () => {
    render(<NewClientForm trainerId="test-trainer-id" />)
    expect(screen.getByText(/add new client/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
  })

  it('should require name field', () => {
    render(<NewClientForm trainerId="test-trainer-id" />)
    const nameInput = screen.getByLabelText(/name \*/i) as HTMLInputElement
    expect(nameInput).toBeRequired()
  })

  it('should allow submitting with just a name', async () => {
    const user = userEvent.setup()
    render(<NewClientForm trainerId="test-trainer-id" />)
    
    const nameInput = screen.getByLabelText(/name \*/i)
    await user.type(nameInput, 'John Doe')
    
    const submitButton = screen.getByRole('button', { name: /create client/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('clients')
    })
  })

  it('should show error message when submission fails', async () => {
    const error = { message: 'Failed to create client' }
    mockSupabaseClient.from = jest.fn(() => ({
      insert: jest.fn(() => Promise.resolve({ error })),
    }))

    const user = userEvent.setup()
    render(<NewClientForm trainerId="test-trainer-id" />)
    
    const nameInput = screen.getByLabelText(/name \*/i)
    await user.type(nameInput, 'John Doe')
    
    const submitButton = screen.getByRole('button', { name: /create client/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/failed to create client/i)).toBeInTheDocument()
    })
  })
})




